import { ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode } from '@/types';

// Normaliza números por extenso em português para dígitos numéricos
export function normalizeSpokenPortugueseNumbers(text: string): string {
  const numberWords: [RegExp, string][] = [
    [/\b(quarenta e nove)\b/gi, '49'],
    [/\b(quarenta e oito)\b/gi, '48'],
    [/\b(quarenta e sete)\b/gi, '47'],
    [/\b(quarenta e seis)\b/gi, '46'],
    [/\b(quarenta e cinco)\b/gi, '45'],
    [/\b(quarenta e quatro)\b/gi, '44'],
    [/\b(quarenta e três|quarenta e tres)\b/gi, '43'],
    [/\b(quarenta e dois)\b/gi, '42'],
    [/\b(quarenta e um)\b/gi, '41'],
    [/\b(quarenta)\b/gi, '40'],
    [/\b(trinta e nove)\b/gi, '39'],
    [/\b(trinta e oito)\b/gi, '38'],
    [/\b(trinta e sete)\b/gi, '37'],
    [/\b(trinta e seis)\b/gi, '36'],
    [/\b(trinta e cinco)\b/gi, '35'],
    [/\b(trinta e quatro)\b/gi, '34'],
    [/\b(trinta e três|trinta e tres)\b/gi, '33'],
    [/\b(trinta e dois)\b/gi, '32'],
    [/\b(trinta e um)\b/gi, '31'],
    [/\b(trinta)\b/gi, '30'],
    [/\b(vinte e nove)\b/gi, '29'],
    [/\b(vinte e oito)\b/gi, '28'],
    [/\b(vinte e sete)\b/gi, '27'],
    [/\b(vinte e seis)\b/gi, '26'],
    [/\b(vinte e cinco)\b/gi, '25'],
    [/\b(vinte e quatro)\b/gi, '24'],
    [/\b(vinte e três|vinte e tres)\b/gi, '23'],
    [/\b(vinte e dois)\b/gi, '22'],
    [/\b(vinte e um)\b/gi, '21'],
    [/\b(vinte)\b/gi, '20'],
    [/\b(dezenove)\b/gi, '19'],
    [/\b(dezoito)\b/gi, '18'],
    [/\b(dezessete)\b/gi, '17'],
    [/\b(dezesseis)\b/gi, '16'],
    [/\b(quinze)\b/gi, '15'],
    [/\b(quatorze|catorze)\b/gi, '14'],
    [/\b(treze)\b/gi, '13'],
    [/\b(doze)\b/gi, '12'],
    [/\b(onze)\b/gi, '11'],
    [/\b(dez)\b/gi, '10'],
    [/\b(nove)\b/gi, '9'],
    [/\b(oito)\b/gi, '8'],
    [/\b(sete)\b/gi, '7'],
    [/\b(seis|meia)\b/gi, '6'],
    [/\b(cinco)\b/gi, '5'],
    [/\b(quatro)\b/gi, '4'],
    [/\b(três|tres)\b/gi, '3'],
    [/\b(dois|duas)\b/gi, '2'],
    [/\b(um|uma)\b/gi, '1'],
    [/\b(zero)\b/gi, '0'],
  ];

  let res = text;
  // Converte "três quilos e meio" -> "3.5kg", "dois quilos e meio" -> "2.5kg", "quatro e meio" -> "4.5"
  res = res.replace(/(\d+)\s*(?:quilos?|kg)?\s*e\s*meio/gi, '$1.5kg');
  res = res.replace(/(?:três|tres)\s*(?:quilos?|kg)?\s*e\s*meio/gi, '3.5kg');
  res = res.replace(/(?:dois|duas)\s*(?:quilos?|kg)?\s*e\s*meio/gi, '2.5kg');
  res = res.replace(/(?:um|uma)\s*(?:quilo|kg)?\s*e\s*meio/gi, '1.5kg');

  for (const [pattern, num] of numberWords) {
    res = res.replace(pattern, num);
  }
  return res;
}

// Função de desduplicação e limpeza de fala para eliminar repetições consecutivas
export function cleanAndDeduplicateSpeech(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\s+/g, ' ').trim();
  // Colapsa apenas palavras inteiras com 3+ letras repetidas consecutivamente (ex: "anos anos" -> "anos", "macho macho" -> "macho")
  text = text.replace(/\b([a-zA-ZÀ-ÿ]{3,})\s+\1\b/gi, '$1');
  return text.trim();
}

// Fallback rule-based parser in case no GEMINI_API_KEY is configured or model fails
export function parseWithRegex(rawText: string): ParsedVoiceResult {
  const textCleaned = cleanAndDeduplicateSpeech(rawText);
  const text = normalizeSpokenPortugueseNumbers(textCleaned);
  const lower = text.toLowerCase();
  
  // 1. Número do animal/paciente falado (ex: "animal 9", "animal 15", "paciente 14", "número 11")
  let spoken_order_index: number | undefined;
  const orderMatch = lower.match(/(?:animal|paciente|número|numero|nº|n°)\s*(\d+)/i);
  if (orderMatch) {
    spoken_order_index = parseInt(orderMatch[1], 10);
  }

  // 2. Espécie
  let species: SpeciesType = 'CAN';
  if (lower.includes('felin') || lower.includes('gato') || lower.includes('gata')) {
    species = 'FEL';
  } else if (
    lower.includes('canin') || lower.includes('cão') || lower.includes('cao') ||
    lower.includes('cachorr') || lower.includes('cadela') || lower.includes('poodle') ||
    lower.includes('pitbull') || lower.includes('galgo') || lower.includes('pastor') ||
    lower.includes('pinscher') || lower.includes('pincher') || lower.includes('shih') || lower.includes('rottweiler')
  ) {
    species = 'CAN';
  }

  // 3. Sexo
  let sex: SexType = 'M';
  if (lower.includes('fêmea') || lower.includes('femea') || lower.includes('cadela') || lower.includes('gata')) {
    sex = 'F';
  } else if (lower.includes('macho') || lower.includes('cão') || lower.includes('gato') || lower.includes('machi')) {
    sex = 'M';
  }

  // 4. Peso (ex: "24kg", "12 quilos", "2.5 kg", "3.5kg", "42kg", "peso 24", "peso de 24")
  let weight_kg: number | undefined;
  const weightWithUnitMatch = lower.match(/(\d+([.,]\d+)?)\s*(?:kg|quilos?|kilos?|quilo)/i);
  if (weightWithUnitMatch) {
    weight_kg = parseFloat(weightWithUnitMatch[1].replace(',', '.'));
  } else {
    const weightPrefixMatch = lower.match(/peso\s*(?:de\s*)?(\d+([.,]\d+)?)/i);
    if (weightPrefixMatch) {
      weight_kg = parseFloat(weightPrefixMatch[1].replace(',', '.'));
    }
  }

  // 5. Idade (ex: "5 anos", "1 ano", "8 meses", "4 anos", "10 anos")
  let age: string | undefined;
  const ageMatch = lower.match(/(\d+)\s*(anos?|meses|mês|ano)/i);
  if (ageMatch) {
    age = `${ageMatch[1]} ${ageMatch[2]}`;
  }

  // 6. Microchip
  let microchip: string | undefined;
  const chipMatch = lower.match(/(?:microchip|chip|número\s+chip|numero\s+chip)\s*([0-9a-zA-Z-]{5,18})/i);
  if (chipMatch) {
    microchip = chipMatch[1].replace(/[^0-9a-zA-Z]/g, '');
  }

  // 7. Raça (com mapeamento fonético para variações de voz)
  let breed = 'SRD';
  const breedMappings: [RegExp, string][] = [
    [/\b(galgo\s+italiano|galgo)\b/i, 'Galgo Italiano'],
    [/\b(pitbull|pit\s+bull|pit\s+bul)\b/i, 'Pitbull'],
    [/\b(poodle|pudle|pudol)\b/i, 'Poodle'],
    [/\b(pinscher|pincher|pinsher|pícher|pincer|esquilos|esquilo)\b/i, 'Pinscher'],
    [/\b(shih\s+tzu|shihtzu|shitzu|shit\s+zu)\b/i, 'Shih Tzu'],
    [/\b(rottweiler|rotweiler|rotvailer|rotevaile|rot)\b/i, 'Rottweiler'],
    [/\b(pastor\s+alemão|pastor\s+alemao|pastor)\b/i, 'Pastor Alemão'],
    [/\b(labrador|labradol)\b/i, 'Labrador'],
    [/\b(golden\s+retriever|golden)\b/i, 'Golden Retriever'],
    [/\b(siamês|siames)\b/i, 'Siamês'],
    [/\b(persa)\b/i, 'Persa'],
    [/\b(bulldog|buldogue|buldog)\b/i, 'Bulldog'],
    [/\b(dachshund|teckel|salsicha)\b/i, 'Dachshund'],
    [/\b(border\s+collie|border)\b/i, 'Border Collie'],
    [/\b(beagle|bigol)\b/i, 'Beagle'],
    [/\b(chihuahua|chiuaua)\b/i, 'Chihuahua'],
    [/\b(spitz|lulu\s+da\s+pomerânia|lulu\s+da\s+pomerania)\b/i, 'Spitz'],
    [/\b(angorá|angora)\b/i, 'Angorá'],
    [/\b(maine\s+coon)\b/i, 'Maine Coon'],
    [/\b(srd|vira[- ]lata|sem\s+raça\s+definida|sem\s+raca\s+definida)\b/i, 'SRD'],
  ];

  for (const [pattern, bName] of breedMappings) {
    if (pattern.test(lower)) {
      breed = bName;
      break;
    }
  }

  // 8. Nome do animal (Multi-Estratégia Inteligente)
  let patient_name = 'Paciente';
  const blacklistWords = [
    'macho', 'femea', 'fêmea', 'canino', 'felino', 'cão', 'cao', 'cadela', 'gato', 'gata',
    'pitbull', 'poodle', 'srd', 'galgo', 'italiano', 'rottweiler', 'pinscher', 'persa', 'siames', 'siamês',
    'esquilos', 'esquilo', 'anos', 'quilos', 'kg', 'animal', 'paciente', 'de', 'do', 'da', 'com', 'sem',
    'propofol', 'propo', 'queta', 'quieta', 'quetamina', 'xilazina', 'mochila', 'axila', 'tramadol', 'tramal',
    'meloxicam', 'melox', 'dipirona', 'dipi', 'agemoxi', 'procedimento', 'osh', 'orq', 'castracao', 'castração',
    'outros', 'pós', 'pos', 'anestesia', 'machi', 'feito', 'microchip', 'chip', 'intercorrencia',
    'intercorrência', 'intercorrências', 'observacao', 'observação', 'obs'
  ];

  // Regra 1: Palavra explícita de nome ("nome [Nome]", "de nome [Nome]", "chamado [Nome]")
  const nameDirectRegex = /(?:nome|de\s+nome|chamad[oa]|paciente\s+chamad[oa])\s+([A-Za-zÀ-ÿ]+)/i;
  const nameDirectMatch = text.match(nameDirectRegex);
  if (nameDirectMatch && nameDirectMatch[1]) {
    const candidate = nameDirectMatch[1].toLowerCase();
    if (!blacklistWords.includes(candidate) && candidate.length > 1) {
      patient_name = nameDirectMatch[1].charAt(0).toUpperCase() + nameDirectMatch[1].slice(1).toLowerCase();
    }
  }

  // Regra 2: Dicionário de Nomes Populares de Pets
  if (patient_name === 'Paciente') {
    const popularNames = [
      'Zeus', 'Luna', 'Bento', 'Hugo', 'Miguel', 'Bob', 'Princesa', 'Mel', 'Spike', 'Mimi',
      'Lulu', 'Thor', 'Amora', 'Nina', 'Max', 'Pipoca', 'Belinha', 'Billy', 'Ted', 'Simba',
      'Meg', 'Mia', 'Chico', 'Fred', 'Toby', 'Marley', 'Pandora', 'Snoopy', 'Jack', 'Apolo',
      'Cookie', 'Pretinha', 'Rex', 'Duque', 'Tobby', 'Suzi', 'Bidu', 'Costelinha', 'Caramelo',
      'Fumaça', 'Floquinho', 'Pérola', 'Sol', 'Lola', 'Theo', 'Babi', 'Maya'
    ];
    for (const name of popularNames) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(text)) {
        patient_name = name;
        break;
      }
    }
  }

  // Regra 3: Palavra imediatamente anterior ao peso ou idade (ex: "Zeus 42kg", "Luna 3.5kg", "Bento 6kg", "Spike 3kg")
  if (patient_name === 'Paciente') {
    const beforeWeightRegex = /(?:^|[,\s])([A-Za-zÀ-ÿ]{2,15})[,.\s]+(?:\d+(?:[.,]\d+)?\s*(?:kg|quilos?|kilos?|anos?|meses))/i;
    const match = text.match(beforeWeightRegex);
    if (match && match[1]) {
      const candidate = match[1].toLowerCase();
      if (!blacklistWords.includes(candidate) && candidate.length > 1) {
        patient_name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
  }

  // Regra 4: Palavra logo após a raça (Ex: "persa Luna", "Shih Tzu Bento", "srd princesa" ou "poodle Bob")
  if (patient_name === 'Paciente') {
    const knownBreedsNames = ['Galgo Italiano', 'Pitbull', 'Poodle', 'Pinscher', 'Shih Tzu', 'Rottweiler', 'Pastor Alemão', 'Labrador', 'Golden Retriever', 'Siamês', 'Persa', 'Bulldog', 'Dachshund', 'Border Collie', 'Beagle', 'Chihuahua', 'Spitz', 'Angorá', 'Maine Coon', 'SRD'];
    const breedFollowerRegex = new RegExp(`(?:${knownBreedsNames.join('|')})[,\\s]+([A-Za-zÀ-ÿ]+)`, 'i');
    const breedFollowerMatch = text.match(breedFollowerRegex);
    if (breedFollowerMatch && breedFollowerMatch[1] && !blacklistWords.includes(breedFollowerMatch[1].toLowerCase()) && breedFollowerMatch[1].length > 1) {
      patient_name = breedFollowerMatch[1].charAt(0).toUpperCase() + breedFollowerMatch[1].slice(1).toLowerCase();
    }
  }

  // 9. Procedimento
  let procedure_type: ProcedureType = sex === 'F' ? 'OSH' : 'ORQ';
  if (
    lower.includes('procedimento 1') || lower.includes('procedimento um') ||
    lower.includes('orquiectomia') || lower.includes('orquio') || lower.includes('orqui') ||
    lower.includes('orque') || lower.match(/\borq\b/) || lower.includes('castração de macho') ||
    lower.includes('castracao de macho')
  ) {
    procedure_type = 'ORQ';
  } else if (
    lower.includes('procedimento 2') || lower.includes('procedimento dois') ||
    lower.match(/\bosh\b/) || lower.includes('ovario') || lower.includes('ovariohisterectomia') ||
    lower.includes('castração de fêmea') || lower.includes('castracao de femea')
  ) {
    procedure_type = 'OSH';
  } else if (
    lower.includes('procedimento 3') || lower.includes('procedimento três') ||
    lower.includes('procedimento tres') || lower.includes('outros') ||
    lower.includes('nodulectomia') || lower.includes('tartarectomia')
  ) {
    procedure_type = 'OUTROS';
  }

  // 10. Fármacos anestésicos (com suporte amplo a fonemas/erros comuns de reconhecimento de voz)
  const anesthesia_drugs: AnesthesiaDrugCode[] = [];

  // Propofol
  if (
    lower.includes('propofol') || lower.includes('propo') || lower.includes('propô') ||
    lower.includes('propa') || lower.includes('propol') || lower.includes('o sol') ||
    lower.match(/\bsol\b/) || lower.includes('pro sol')
  ) {
    anesthesia_drugs.push('P');
  }
  // Isoflurano
  if (
    lower.includes('isoflurano') || lower.includes('isoflorano') || lower.match(/\biso\b/) ||
    lower.includes('inalatória') || lower.includes('inalatoria')
  ) {
    anesthesia_drugs.push('I');
  }
  // Quetamina
  if (
    lower.includes('quetamina') || lower.includes('ketamina') || lower.includes('queta') ||
    lower.includes('quieta') || lower.includes('quita') || lower.includes('keta')
  ) {
    anesthesia_drugs.push('K');
  }
  // Xilazina (inclui fonemas comuns como mochila, axila, chila, quila)
  if (
    lower.includes('xilazina') || lower.includes('xila') || lower.includes('mochila') ||
    lower.includes('axila') || lower.includes('chila') || lower.includes('quila') ||
    lower.includes('zilazina') || lower.includes('estila')
  ) {
    anesthesia_drugs.push('X');
  }
  // Tramadol
  if (lower.includes('tramadol') || lower.includes('tramal') || lower.includes('tranal') || lower.includes('tramado')) {
    anesthesia_drugs.push('T');
  }
  // Vitamina K
  if (lower.includes('vitamina k') || lower.includes('vit k') || lower.includes('vitk') || lower.includes('fitomenadiona')) {
    anesthesia_drugs.push('VK');
  }
  // Transamin
  if (lower.includes('transamin') || lower.includes('tranexâmico') || lower.includes('tranexamico') || lower.includes('transamim')) {
    anesthesia_drugs.push('TM');
  }

  // 11. Medicação pós
  const post_meds: PostMedCode[] = [];
  // Agemoxi
  if (lower.includes('agemoxi') || lower.includes('amoxicilina') || lower.includes('amoxi') || lower.includes('antibiótico') || lower.includes('antibiotico')) {
    post_meds.push('A');
  }
  // Meloxicam
  if (lower.includes('meloxicam') || lower.includes('melox') || lower.includes('meloc') || lower.includes('anti-inflamatório') || lower.includes('antiinflamatorio')) {
    post_meds.push('M');
  }
  // Dipirona
  if (lower.includes('dipirona') || lower.includes('dipi') || lower.includes('analgésico') || lower.includes('analgesico') || lower.includes('iso de pós')) {
    post_meds.push('D');
  }

  // 12. Intercorrências
  let has_complication = false;
  let complication_notes: string | undefined;

  // Extrair bloco de intercorrência primeiro (ex: "Intercorrência: Pequena bradicardia no início")
  const complicationBlockMatch = text.match(/[Ii]ntercorr[êe]ncia[:\s]+(.+?)(?:\.|$)/);

  if (
    lower.includes('intercorrência') ||
    lower.includes('intercorrencia') ||
    lower.includes('intercorrências') ||
    lower.includes('complicação') ||
    lower.includes('hipotermia') ||
    lower.includes('bradicardia') ||
    lower.includes('parada') ||
    lower.includes('hemorragia') ||
    lower.includes('sangramento') ||
    lower.includes('apneia') ||
    lower.includes('taquicardia') ||
    lower.includes('cianose')
  ) {
    if (!lower.includes('sem intercorrência') && !lower.includes('sem complicação') && !lower.includes('sem intercorrencia') && !lower.includes('sem intercorrências')) {
      has_complication = true;
      complication_notes = complicationBlockMatch ? complicationBlockMatch[1].trim() : text;
    }
  }

  // 13. Observações clínicas específicas (ex: "obs: jejum ok", "observação: animal agitado")
  let observations = '';
  const obsMatch = text.match(/(?:observa[çc][ãa]o|obs|nota)[:\s]+(.+?)(?:\.|$)/i);
  if (obsMatch && obsMatch[1]) {
    observations = obsMatch[1].trim();
  }

  return {
    spoken_order_index,
    species,
    sex,
    breed,
    patient_name,
    weight_kg: weight_kg || 10.0,
    age: age || '2 anos',
    microchip,
    procedure_type,
    anesthesia_drugs: anesthesia_drugs.length > 0 ? anesthesia_drugs : ['P', 'K'],
    post_meds: post_meds.length > 0 ? post_meds : ['M', 'D'],
    has_complication,
    complication_notes,
    observations,
    raw_transcription: text,
    confidence_summary: 'Processado com sucesso',
  };
}
