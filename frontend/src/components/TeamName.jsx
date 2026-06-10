const teamFlags = {
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  'Bosnia and Herzegovina': '🇧🇦',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  'Cabo Verde': '🇨🇻',
  Colombia: '🇨🇴',
  'Congo DR': '🇨🇩',
  Croatia: '🇭🇷',
  Curaçao: '🇨🇼',
  Czechia: '🇨🇿',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Haiti: '🇭🇹',
  Iraq: '🇮🇶',
  'IR Iran': '🇮🇷',
  "Côte d'Ivoire": '🇨🇮',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  'Korea Republic': '🇰🇷',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  'New Zealand': '🇳🇿',
  Norway: '🇳🇴',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Scotland: '🏴',
  Senegal: '🇸🇳',
  'South Africa': '🇿🇦',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Tunisia: '🇹🇳',
  Türkiye: '🇹🇷',
  Uruguay: '🇺🇾',
  USA: '🇺🇸',
  Uzbekistan: '🇺🇿'
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

export function TeamName({ name, align = 'start' }) {
  const flag = teamFlags[name];
  const displayName = getTeamNamePt(name);

  return (
    <span className={`team-name ${align === 'end' ? 'team-name-end' : ''}`}>
      {flag && <span className="team-flag" aria-hidden="true">{flag}</span>}
      <span>{displayName}</span>
    </span>
  );
}
