const teamFlagCodes = {
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  'Bosnia and Herzegovina': 'ba',
  Brazil: 'br',
  Canada: 'ca',
  'Cabo Verde': 'cv',
  Colombia: 'co',
  'Congo DR': 'cd',
  Croatia: 'hr',
  Curaçao: 'cw',
  Czechia: 'cz',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  Iraq: 'iq',
  'IR Iran': 'ir',
  "Côte d'Ivoire": 'ci',
  Japan: 'jp',
  Jordan: 'jo',
  'Korea Republic': 'kr',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  'South Africa': 'za',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Türkiye: 'tr',
  Uruguay: 'uy',
  USA: 'us',
  Uzbekistan: 'uz'
};

const teamNamesPt = {
  Algeria: 'Argélia',
  Argentina: 'Argentina',
  Australia: 'Austrália',
  Austria: 'Áustria',
  Belgium: 'Bélgica',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  Brazil: 'Brasil',
  Canada: 'Canadá',
  'Cabo Verde': 'Cabo Verde',
  Colombia: 'Colômbia',
  'Congo DR': 'RD Congo',
  Croatia: 'Croácia',
  Curaçao: 'Curaçao',
  Czechia: 'Tchéquia',
  Ecuador: 'Equador',
  Egypt: 'Egito',
  England: 'Inglaterra',
  France: 'França',
  Germany: 'Alemanha',
  Ghana: 'Gana',
  Haiti: 'Haiti',
  Iraq: 'Iraque',
  'IR Iran': 'Irã',
  "Côte d'Ivoire": 'Costa do Marfim',
  Japan: 'Japão',
  Jordan: 'Jordânia',
  'Korea Republic': 'Coreia do Sul',
  Mexico: 'México',
  Morocco: 'Marrocos',
  Netherlands: 'Países Baixos',
  'New Zealand': 'Nova Zelândia',
  Norway: 'Noruega',
  Panama: 'Panamá',
  Paraguay: 'Paraguai',
  Portugal: 'Portugal',
  Qatar: 'Catar',
  'Saudi Arabia': 'Arábia Saudita',
  Scotland: 'Escócia',
  Senegal: 'Senegal',
  'South Africa': 'África do Sul',
  Spain: 'Espanha',
  Sweden: 'Suécia',
  Switzerland: 'Suíça',
  Tunisia: 'Tunísia',
  Türkiye: 'Turquia',
  Uruguay: 'Uruguai',
  USA: 'Estados Unidos',
  Uzbekistan: 'Uzbequistão'
};

export function getTeamNamePt(name) {
  return teamNamesPt[name] || name;
}

export function getTeamFlagUrl(name) {
  const code = teamFlagCodes[name];
  return code ? `https://flagcdn.com/${code}.svg` : '';
}

export function TeamFlag({ name, className = 'team-flag' }) {
  const flagUrl = getTeamFlagUrl(name);

  if (!flagUrl) return null;

  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
      src={flagUrl}
    />
  );
}

export function TeamName({ name, align = 'start' }) {
  const displayName = getTeamNamePt(name);

  return (
    <span className={`team-name ${align === 'end' ? 'team-name-end' : ''}`} title={displayName}>
      <TeamFlag name={name} />
      <span>{displayName}</span>
    </span>
  );
}
