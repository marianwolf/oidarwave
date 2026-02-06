export interface RadioStation {
  url: string;
  name: string;
  metadataUrl?: string;
}

export interface VideoStation {
  url: string;
  name: string;
}

export const radioStations: RadioStation[] = [
  {
    url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',
    name: 'Deutschlandfunk',
    metadataUrl: 'https://streamtext.dradio.de/dlf.txt',
  },
  {
    url: 'https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3',
    name: 'Deutschlandfunk Nova',
    metadataUrl: 'https://static.deutschlandfunknova.de/actions/dradio/playlist/onair',
  },
  {
    url: 'https://f121.rndfnk.com/ard/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3?aggregator=web&cid=01FCT9XYE3C7Y8087XEWPRC38Z&sid=30aynlfxURrCQmDeTH1p0OqVsoV&token=3Wf1JnFUByNruoizm4AdR_YPX5_CvsRtTKXV3VK-004&tvf=qhyw4VgcVxhmMTIxLnJuZGZuay5jb20',
    name: 'NDR 1 NDS',
    metadataUrl: 'https://www.ndr.de/public/radioplaylists/ndr1niedersachsen.json',
  },
  {
    url: 'https://f131.rndfnk.com/ard/ndr/ndr2/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2CWDYWJHGF4QAJ0SVV730&sid=30ayvsXjJydzMH4MNiWpLV4nURH&token=FMhlmkJlc2prmQ6CBBjpYxFSaNHq6IDWPQKR9jRDjMA&tvf=0axLwWccVxhmMTMxLnJuZGZuay5jb20',
    name: 'NDR 2',
    metadataUrl: 'https://www.ndr.de/public/radioplaylists/ndr2.json',
  },
  {
    url: 'https://f131.rndfnk.com/ard/ndr/ndrinfo/niedersachsen/mp3/128/stream.mp3?aggregator=web&cid=01FBRKHKTB73QDVNX7A9RT082R&sid=30az5c4cyuUHsy4tHS3YkD5oDcc&token=Z-H6aIgEFsx5kBPmtfq5x2UNGGmMOtyjcoYox9RHg2E&tvf=np8tvHkcVxhmMTMxLnJuZGZuay5jb20',
    name: 'NDR Info',
    metadataUrl: 'https://www.ndr.de/epg/current/station-ndrinfo',
  },
  {
    url: 'https://d141.rndfnk.com/ard/ndr/ndrkultur/live/mp3/128/stream.mp3?aggregator=web&cid=01FBQ2EJ6T7QK3WENQ5KT9S2FB&sid=30azBxZOH15ri7EofrRpS1t3RXT&token=T_eVqj_rP6Bkb57di3056sjieytJKHDUnaT86DKLi-o&tvf=P4FiYIUcVxhkMTQxLnJuZGZuay5jb20',
    name: 'NDR Kultur',
    metadataUrl: 'https://www.ndr.de/public/radioplaylists/ndrkultur.json',
  },
  {
    url: 'https://f121.rndfnk.com/ard/ndr/njoy/live/mp3/128/stream.mp3?aggregator=web&cid=01FBRKKTM6TVGA3B3W6Y8NMXK8&sid=30azMobKXI3x91RNnGaf7v0Jpbl&token=VvAbuddXUjbU602noIVp6b7CQBEikUS280qPiNmxABM&tvf=i4pneZkcVxhmMTIxLnJuZGZuay5jb20',
    name: 'N-JOY',
    metadataUrl: 'https://www.ndr.de/public/radioplaylists/njoy.json',
  },
  {
    url: 'https://regiocast.streamabc.net/regc-80s80smweb2517500-mp3-192-1672667',
    name: '80s80s Digital',
    metadataUrl: 'https://iris-80s80s.loverad.io/flow.json?station=62',
  },
  {
    url: 'https://regiocast.streamabc.net/regc-90s90spop4760822-mp3-192-9403761',
    name: '90s90s',
    metadataUrl: '',
  },
  {
    url: 'https://radio.bbg-bew.de',
    name: 'BBG Radio',
    metadataUrl: '',
  },
];

export const videoStations: VideoStation[] = [
  {
    url: 'https://daserste-live.ard-mcdn.de/daserste/live/hls/de/master.m3u8',
    name: 'Das Erste',
  },
  {
    url: 'https://zdf-hls-15.akamaized.net/hls/live/2016498/de/veryhigh/master.m3u8',
    name: 'ZDF',
  },
  {
    url: 'https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8',
    name: 'ARTE',
  },
  {
    url: 'https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8',
    name: 'Tagesschau24',
  },
];
