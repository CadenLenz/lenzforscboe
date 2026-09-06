"""Verify source prose survives HTML formatting. Run from repository root with Python 3."""
from pathlib import Path
from html.parser import HTMLParser
import re

class Content(HTMLParser):
    def __init__(self):
        super().__init__(); self.current=None; self.sections={}; self.all=[]; self.skip=False; self.ids=[]; self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag=='a' and attrs.get('href','').startswith('#'): self.links.append(attrs['href'][1:])
        if tag=='section': self.current=attrs['id']; self.sections[self.current]=[]
        if tag in ('script','style'): self.skip=True
    def handle_endtag(self,tag):
        if tag=='section': self.current=None
        if tag in ('script','style'): self.skip=False
    def handle_data(self,data):
        if self.skip:return
        self.all.append(data)
        if self.current: self.sections[self.current].append(data)

normalize=lambda text:' '.join(text.split())
source=normalize(re.sub(r'PAGE \d+','',Path('docs/source-extract.txt').read_text(encoding='utf-8')))
between=lambda a,b:source.split(a,1)[1].split(b,1)[0].strip()
page=Content();page.feed(Path('public/index.html').read_text(encoding='utf-8-sig'))
sections={k:normalize(' '.join(v)) for k,v in page.sections.items()}
expected={
 'meet':'For more than two decades, '+between('● For more than two decades,','Experience at Every Level'),
 'experience':between('Experience at Every Level To Include :','Why I am Running'),
 'why':between('Why I am Running To include:','Role of the County Board of Education'),
 'ready':between('Ready to Serve','Endorsements To include:'),
 'donations':'This campaign is not accepting donations. '+between('This campaign is not accepting donations.','Contact To Include:'),
 'contact':between('Let’s Connect','Campaign Email'),
}
for key,value in expected.items():
    assert normalize(value) in sections[key],f'Source prose mismatch: {key}'
for value in [between('A Different Role Than a Local School Board','A County Board of Education has'),
              'A County Board of Education has '+between('A County Board of Education has','Areas of Authority'),
              between('Areas of Authority','Beyond its defined statutory'),
              'Beyond its defined statutory '+between('Beyond its defined statutory','Ready to Serve')]:
    assert normalize(value) in sections['board'],'Board source prose mismatch'
intro=between('Endorsements To include:','Endorsed By')
assert intro in sections['endorsements'],'Endorsement fragment mismatch'
all_text=normalize(' '.join(page.all))
for value in ['Jonathan Lenz for Sonoma County Board of Education, Trustee Area 2','Experience. Leadership. A commitment to students and schools.',
 'Paid for by Jonathan Lenz, candidate for Sonoma County Board of Education, Trustee Area 2.',
 'This is a campaign website and is not affiliated with the Sonoma County Office of Education or Sonoma County Board of Education.']:
    assert value in all_text,value
thanks=between('After submission:','Donations To include:')
assert thanks in Path('public/js/endorsements.js').read_text(encoding='utf-8'),'Thank-you mismatch'
assert len(page.ids)==len(set(page.ids)),'Duplicate HTML IDs'
assert all(link in page.ids for link in page.links),'Broken local anchor'
assert len(sections)==9,'Expected nine campaign sections'
print('PASS: all campaign prose, source fragment, thank-you, footer statements, nine sections and local anchors accounted for.')
