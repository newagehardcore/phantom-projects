export const pressClips = [
  { publication: 'The New York Times', logo: 'new-york-times', quote: 'Even though thick smoke was choking the room, everything felt bright, erotic, alive.' },
  { publication: 'Artforum', logo: 'artforum', quote: 'Haunting soundtracks of words and music' },
  { publication: 'The Guardian', logo: 'guardian', quote: '…Ross’s thunderous electronics unlock the space’s full potential' },
  { publication: 'Pitchfork', logo: 'pitchfork', quote: '…amusing, creepy, the overall effect is that of a futuristic gloss, each sourced note subsumed into a larger whole.' },
  { publication: 'Dazed', logo: 'dazed', quote: '…first-person audiovisual voyages through seamless, cineplexscaled, techno landscapes wrought in glossy HD' },
  { publication: 'VICE', logo: 'vice', quote: 'Challenging and intricately beautiful…' },
  { publication: 'The Fader', logo: 'fader', quote: 'Way too jubilant and visceral of an experience…' },
  { publication: 'Interview Magazine', logo: 'interview', quote: '…lifestyle-driven adventures that navigate YouTube binges and tab-hoarding fusion…' },
  { publication: 'The Quietus', logo: 'quietus', quote: '…within a tangible virtual space, both unreal and noxious, the impossible architecture zigzags up the walls, all but undetectable within the fog…' },
]

type Client = {
  name: string
  href: string
  location?: string
  logo?: string
}

function group(heading: string, rows: string, textOnly = false) {
  const clients: Client[] = rows.trim().split('\n').map((row) => {
    const [name, href, location, logo] = row.split('|')
    return { name, href, location, logo }
  })
  return { heading, clients, textOnly }
}

export const clientGroups = [
  group('Brands', `
Prada|https://www.prada.com/||/clients/prada.png
Fendi|https://www.fendi.com/||/clients/fendi.png
Telfar|https://telfar.net/||/clients/telfar.png
Luar|https://luar.world/||/clients/luar.png
Kenzo|https://www.kenzo.com/||/clients/kenzo.png
Crosby Studios|https://crosbystudios.com/info/||/clients/crosby.png
Highsnobiety|https://www.highsnobiety.com/||/clients/highsnobiety.png
Nowness|https://www.nowness.com/||/clients/nowness.png
Delta|https://www.delta.com/||/clients/delta.png
Tommy Hilfiger|https://www.tommy.com/||/clients/tommy-hilfiger.png
Adidas|https://www.adidas.com/||/clients/adidas.png
Boy Smells|https://boysmells.com/||/clients/boy-smells.png
Victoria Secret|https://www.victoriassecret.com/||/clients/victoria-secret.png
VICE|https://www.vice.com/||/press/vice.png
Nike|https://www.nike.com/||/clients/nike.png
Express|https://www.express.com/||/clients/express.png
Vogue|https://www.vogue.com/||/clients/vogue.png
Yamaha|https://www.yamaha.com/||/clients/yamaha.png
Bratz|https://www.bratz.com/||/clients/bratz.png
Ecco|https://global.ecco.com/||/clients/ecco.png
Duolingo|https://www.duolingo.com/||/clients/duolingo.png
`),
  group('Record Labels', `
Warp Records|https://warp.net/||/clients/warp.png
Capitol Records|https://www.capitolrecords.com/||/clients/capitol.png
Hippos in Tanks|https://ra.co/labels/5342||/clients/hippos.png
Naxos Records|https://www.naxos.com/||/clients/naxos.png
Merok Records|https://a-d-r.net/category/gatekeeper/||/clients/merok.png
Presto! Records|https://prestorecords.bandcamp.com/||/clients/presto.png
Legendarium|https://a-d-r.net/category/adr/||/clients/legendarium.png
`),
  group('Museums + Galleries', `
MoMA|https://www.moma.org/|New York, US|/clients/moma.png
The Met|https://engage.metmuseum.org/events/metlivearts/fy23-24/jacolby-satterwhite-a-metta-prayer/a-metta-prayer-lafawndah-with-nightfeelings/|New York, US|/clients/met.png
The Whitney Museum of American Art|https://whitney.org/|New York, US|/clients/whitney.png
Gagosian Gallery|https://gagosian.com/|New York, US|/clients/gagosian.png
MoMA PS1|https://www.momaps1.org/en/programs/421-warm-up-2024|Queens, New York, US|/clients/moma-ps1.png
Walker Art Center|https://walkerart.org/|Minneapolis, US|/clients/walker.png
Art Institute of Chicago|https://www.artic.edu/|Chicago, US|/clients/art-institute-chicago.png
Institute of Contemporary Arts (ICA)|https://www.ica.art/|London, GB|/clients/ica.png
Moderna Museet|https://www.modernamuseet.se/en/stockholm/exhibitions/korakrit-arunanondchai/|Stockholm, SE|/clients/moderna.png
Saatchi Gallery|https://www.saatchigallery.com/|London, GB|/clients/saatchi.png
New Museum|https://www.newmuseum.org/exhibition/new-humans-memories-of-the-future/|New York, US|/clients/new-museum.png
Aspen Art Museum|https://aspenartmuseum.org/program/audience-plant-2024/|Aspen, Colorado, US|/clients/aspen-art.png
de Young Museum|https://www.famsf.org/exhibitions/uncanny-valley|San Francisco, US|/clients/de-young.png
Museum of Arts and Design|https://madmuseum.org/|New York, US|/clients/mad.png
Pérez Art Museum Miami|https://www.pamm.org/|Miami, Florida, US|/clients/pamm.png
Kunstverein Hamburg|https://kunstverein.de/|Hamburg, DE|/clients/kunstverein.png
Migros Museum für Gegenwartskunst|https://migrosmuseum.ch/en/|Zurich, CH|/clients/migros.png
Singapore Art Museum|https://www.singaporeartmuseum.sg/Art-Events/Exhibitions/Proof-of-Personhood|Singapore, SG|/clients/singapore-art.png
Serralves Museum|https://www.serralves.pt/en/|Porto, PT|/clients/serralves.png
Art Sonje Center|https://artsonje.org/en/|Seoul, KR|/clients/art-sonje.png
WIELS|https://www.wiels.org/en/|Brussels, BE|/clients/wiels.png
Spazio Maiocchi|https://spaziomaiocchi.com/|Milan, IT|/clients/spazio.png
Schinkel Pavillon|https://www.schinkelpavillon.de/|Berlin, DE|/clients/schinkel.png
KW Institute for Contemporary Art|https://www.kw-berlin.de/en/exhibitions/christopher-kulendran-thomas-another-world|Berlin, DE|/clients/kw.png
`),
  group('Festivals', `
Venice Biennale|https://www.labiennale.org/en/art/2019/partecipants/korakrit-arunanondchai|Venice, IT|/clients/venice.png
Primavera Sound|https://www.primaverasound.com/en/barcelona|Barcelona, ES|/clients/primavera.png
Pitchfork Music Festival|https://pitchfork.com/news/pitchfork-music-festival-2024-lineup-and-dates-announced/|Chicago, US|/clients/pitchfork-fest.png
Sundance Film Festival|https://festival.sundance.org/|Park City, Utah, US|/clients/sundance.png
SXSW Film & TV Festival|https://sxsw.com/festivals/film/|Austin, Texas, US|/clients/sxsw.png
Locarno Film Festival|https://www.locarnofestival.ch/|Locarno, CH|/clients/locarno.png
International Film Festival Rotterdam|https://iffr.com/en|Rotterdam, NL|/clients/iffr.png
Berlin Biennale|https://www.berlinbiennale.de/en/|Berlin, DE|/clients/berlin-biennale.png
Gwangju Biennale|https://www.gwangjubiennale.org/|Gwangju, KR|/clients/gwangju.png
Art Basel Miami Beach|https://www.artbasel.com/miami-beach|Miami Beach, Florida, US|/clients/basel.png
Stockholm International Film Festival|https://www.stockholmfilmfestival.se/|Stockholm, SE|/clients/stockholm-fest.png
Kunstenfestivaldesarts|https://www.kfda.be/en/|Brussels, BE|/clients/kunsten.png
Performa Biennial|https://performa-arts.org/|New York, US|/clients/performa.png
AIR Aspen|https://airaspen.org/|Aspen, US|/clients/air-aspen.png
`),
  group('Venues', `
Barbican Centre|https://www.barbican.org.uk/whats-on/2018/event/oneohtrix-point-never-myriad-curl|London, GB|/clients/barbican.png
Park Avenue Armory|https://www.armoryonpark.org/season-events/2018-season/myriad/|New York, US|/clients/armory.png
The Shed|https://theshed.org/|New York, US|/clients/shed.png
Walt Disney Concert Hall|https://www.laphil.com/about-us/our-venues/about-walt-disney-concert-hall|Los Angeles, US|/clients/disney.png
Roundhouse|https://www.roundhouse.org.uk/|London, GB|/clients/roundhouse.png
Rockefeller Center|https://www.rockefellercenter.com/|New York, US|/clients/rockefeller.png
BAM — Brooklyn Academy of Music|https://www.bam.org/|Brooklyn, New York, US|/clients/bam.png
Monument-National|https://www.monumentnational.com/|Montreal, CA|/clients/monument.png
Wheeler Opera House|https://wheeleroperahouse.com/event/commedia-dellarte/|Aspen, Colorado, US|/clients/wheeler.png
HKW — Haus der Kulturen der Welt|https://www.hkw.de/en/|Berlin, DE|/clients/hkw.png
Volksbühne|https://www.volksbuehne.berlin/|Berlin, DE|/clients/volksbuhne.png
Pioneer Works|https://pioneerworks.org/programs/paradise-container|Brooklyn, New York, US|/clients/pioneer.png
CENTQUATRE-PARIS|https://www.104.fr/|Paris, FR|/clients/centquatre.png
Performance Space New York|https://performancespacenewyork.org/|New York, US|/clients/performance-space.png
Issue Project Room|https://issueprojectroom.org/|Brooklyn, New York, US|/clients/issue.png
EMPAC|https://empac.rpi.edu/|Troy, New York, US|/clients/empac.png
Funkhaus|https://www.funkhaus-berlin.net/|Berlin, DE|/clients/funkhaus.png
Knockdown Center|https://knockdown.center/|Queens, New York, US|/clients/knockdown.png
Tieranatomisches Theater|https://www.kw-berlin.de/en/exhibitions/exhibition-kw-on-location-rachel-rossin-the-maw-of|Berlin, DE|/clients/tieranatomisches.png
`),
  group('Music', `
Kelela|https://www.kelela.co/
Oneohtrix Point Never|https://pointnever.com/
Jason Moran|https://www.walkerart.org/collections/artist/jason-moran/
Kelsey Lu|https://www.kelsey.lu/
Zsela|https://zselaofficial.bandcamp.com/
Eartheater|https://eartheater.world/
Fatima Al Qadiri|https://www.fatimaalqadiri.com/
Mykki Blanco|https://transgressiverecords.com/artist/mykki-blanco/
Lafawndah|https://lafawndah.com/home/
L-vis 1990|https://l-vis1990.bandcamp.com/
Sam Gendel|https://www.samgendel.com/
JK Kim|https://www.instagram.com/deepfrieddrum/
Nightfeelings|https://www.instagram.com/nightfeelingss/
Colin Self|https://colin-self.com/
Total Freedom|https://www.nts.live/artists/23057-total-freedom
Kelly Moran|https://kellymoran.warp.net/
Eli Keszler|https://www.elikeszler.com/
Laurel Halo|https://www.laurelhalo.com/
Holly Herndon & Mat Dryhurst|https://herndondryhurst.studio/
`, true),
  group('Film', `
Safdie Brothers|https://elara.world/
Adam Wingard|https://www.undertheradarmag.com/reviews/the_guest
Daniel Schmidt|https://www.filmlinc.org/films/the-unity-of-all-things/
Monica Mirabile|https://monicamirabile.com/
Karen Maine|https://www.karenmaine.com/
Romina Cenisio|https://www.rominacenisio.com/
Radical Friend|https://www.radicalfriend.com/musicvideos.html
Taylore Scarabelli|https://substack.com/@taylorescarabelli
Martine Syms|https://www.martinesy.ms/
`, true),
  group('Fine Art', `
Ryan Trecartin|https://spruethmagers.com/artists/ryan-trecartin-ryt/
Camille Henrot|https://www.hauserwirth.com/artists/35528-camille-henrot/
Rachel Rossin|https://readymag.website/u1012238909/RR00/
Christopher Kullundren Thomas|https://www.kw-berlin.de/en/exhibitions/christopher-kulendran-thomas-another-world
Korakrit Arunandonchai|https://artmuseum.pl/en/artists/korakrit-arunanondchai
Wang Shui|https://whitney.org/artists/18809
Tabor Robak|https://taborrobak.com/
Tosh Basco|https://www.instagram.com/toshbasco/
Xavier Cha|https://47canal.us/artists/xavier-cha
Martine Syms|https://www.martinesy.ms/
Holly Herndon & Mat Dryhurst|https://herndondryhurst.studio/
`, true),
]
