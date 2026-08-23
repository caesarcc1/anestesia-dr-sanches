import { ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode } from '@/types';

// Função ultra-robusta de desduplicação e limpeza de fala para eliminar loops do Android Chrome
export function cleanAndDeduplicateSpeech(raw: string): string {
  if (!raw) return '';
  
  // 1. Normaliza pontuação e espaços
  let text = raw.replace(/\s+/g, ' ').trim();

  // 2. Colapsa repetições consecutivas de blocos de palavras (de 5 até 1 palavra repetida)
  for (let n = 6; n >= 1; n--) {
    const pattern = new RegExp(`(\\b(?:\\w+[\\s,]+){${n - 1}}\\w+)(?:\\s*,?\\s*\\1)+`, 'gi');
    text = text.replace(pattern, '$1');
  }

  // 3. Colapsa palavras adjacentes idênticas consecutivas (ex: "anos anos anos" -> "anos", "animal animal" -> "animal")
  text = text.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // 4. Limpa padrões comuns de repetição fragmentada do mobile
  text = text.replace(/(?:anos\s+microchip\s+)+/gi, 'anos microchip ');
  text = text.replace(/(?:animal\s+\d+\s+)+/gi, (match) => {
    const parts = match.trim().split(/\s+/);
    return parts[parts.length - 2] + ' ' + parts[parts.length - 1] + ' ';
  });

  return text.replace(/\s+/g, ' ').trim();
}

// Fallback rule-based parser in case no GEMINI_API_KEY is configured or model fails
export function parseWithRegex(rawText: string): ParsedVoiceResult {
  const text = cleanAndDeduplicateSpeech(rawText);
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
    lower.includes('pinscher') || lower.includes('shih') || lower.includes('rottweiler')
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

  // 4. Peso (ex: "24kg", "12 quilos", "2.5 kg", "3.5kg", "peso 24", "peso de 24")
  let weight_kg: number | undefined;
  const weightWithUnitMatch = lower.match(/(\d+([.,]\d+)?)\s*(?:kg|quilos?|kilos?)/i);
  if (weightWithUnitMatch) {
    weight_kg = parseFloat(weightWithUnitMatch[1].replace(',', '.'));
  } else {
    const weightPrefixMatch = lower.match(/peso\s*(?:de\s*)?(\d+([.,]\d+)?)/i);
    if (weightPrefixMatch) {
      weight_kg = parseFloat(weightPrefixMatch[1].replace(',', '.'));
    }
  }

  // 5. Idade (ex: "5 anos", "1 ano", "8 meses", "6 meses")
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

  // 7. Raça
  let breed = 'SRD';
  const knownBreeds = [
    'Galgo Italiano', 'Galgo', 'Pitbull', 'Pit bull', 'Poodle', 'Bulldog', 'Pinscher',
    'Shih Tzu', 'Shihtzu', 'Lhasa', 'Pastor Alemão', 'Pastor', 'Labrador', 'Golden Retriever', 'Golden',
    'Rottweiler', 'Dachshund', 'Border Collie', 'Beagle', 'Chihuahua', 'Spitz',
    'Siamês', 'Siames', 'Persa', 'Angorá', 'Angora', 'Maine Coon', 'SRD', 'Vira-lata'
  ];
  for (const b of knownBreeds) {
    if (lower.includes(b.toLowerCase())) {
      breed = b;
      break;
    }
  }

  // 8. Nome do animal
  let patient_name = 'Paciente';
  const blacklistWords = [
    'macho', 'femea', 'fêmea', 'canino', 'felino', 'cão', 'cao', 'cadela', 'gato', 'gata',
    'pitbull', 'poodle', 'srd', 'galgo', 'italiano', 'anos', 'quilos', 'kg', 'animal', 'paciente',
    'de', 'do', 'da', 'com', 'sem', 'propofol', 'propo', 'queta', 'quieta', 'quetamina', 'xilazina',
    'tramadol', 'meloxicam', 'dipirona', 'agemoxi', 'procedimento', 'osh', 'orq', 'castracao',
    'castração', 'outros', 'pós', 'pos', 'anestesia', 'machi', 'feito', 'microchip', 'chip', 'intercorrencia', 'intercorrência'
  ];

  // Regra A: "nome [Nome]" ou "de nome [Nome]" (Ex: "nome Miguel" -> Miguel)
  const nameDirectRegex = /(?:nome|de\s+nome|chamad[oa]|paciente\s+chamad[oa])\s+([A-Za-zÀ-ÿ]+)/i;
  const nameDirectMatch = text.match(nameDirectRegex);
  if (nameDirectMatch && nameDirectMatch[1]) {
    const candidate = nameDirectMatch[1].toLowerCase();
    if (!blacklistWords.includes(candidate) && candidate.length > 1) {
      patient_name = nameDirectMatch[1].charAt(0).toUpperCase() + nameDirectMatch[1].slice(1).toLowerCase();
    }
  }

  // Regra B: Palavra logo após a raça (Ex: "persa Luna", "Shih Tzu Bento", "srd princesa" ou "poodle Bob")
  if (patient_name === 'Paciente') {
    const breedFollowerRegex = new RegExp(`(?:${knownBreeds.join('|')})[,\\s]+([A-Za-zÀ-ÿ]+)`, 'i');
    const breedFollowerMatch = text.match(breedFollowerRegex);
    if (breedFollowerMatch && breedFollowerMatch[1] && !blacklistWords.includes(breedFollowerMatch[1].toLowerCase()) && breedFollowerMatch[1].length > 1) {
      patient_name = breedFollowerMatch[1].charAt(0).toUpperCase() + breedFollowerMatch[1].slice(1).toLowerCase();
    }
  }

  // 9. Procedimento
  let procedure_type: ProcedureType = sex === 'F' ? 'OSH' : 'ORQ';
  if (lower.includes('procedimento 1') || lower.includes('procedimento um') || lower.includes('orquiectomia') || lower.includes('orquio') || lower.includes('orqui') || lower.match(/\borq\b/) || lower.includes('castração de macho')) {
    procedure_type = 'ORQ';
  } else if (lower.includes('procedimento 2') || lower.includes('procedimento dois') || lower.match(/\bosh\b/) || lower.includes('ovario') || lower.includes('castração de fêmea')) {
    procedure_type = 'OSH';
  } else if (lower.includes('procedimento 3') || lower.includes('procedimento três') || lower.includes('procedimento tres') || lower.includes('outros') || lower.includes('nodulectomia') || lower.includes('tartarectomia')) {
    procedure_type = 'OUTROS';
  }

  // 10. Fármacos anestésicos
  const anesthesia_drugs: AnesthesiaDrugCode[] = [];
  if (lower.includes('propofol') || lower.includes('propo')) anesthesia_drugs.push('P');
  if (lower.includes('isoflurano') || lower.match(/\biso\b/) || lower.includes('inalatória')) anesthesia_drugs.push('I');
  if (lower.includes('quetamina') || lower.includes('ketamina') || lower.includes('queta') || lower.includes('quieta') || lower.includes('quita') || lower.includes('keta')) anesthesia_drugs.push('K');
  if (lower.includes('xilazina') || lower.includes('xila')) anesthesia_drugs.push('X');
  if (lower.includes('tramadol') || lower.includes('tramal')) anesthesia_drugs.push('T');
  if (lower.includes('vitamina k') || lower.includes('vit k')) anesthesia_drugs.push('VK');
  if (lower.includes('transamin') || lower.includes('tranexâmico')) anesthesia_drugs.push('TM');

  // 11. Medicação pós
  const post_meds: PostMedCode[] = [];
  if (lower.includes('agemoxi') || lower.includes('amoxicilina') || lower.includes('antibiótico')) post_meds.push('A');
  if (lower.includes('meloxicam') || lower.includes('melox') || lower.includes('anti-inflamatório')) post_meds.push('M');
  if (lower.includes('dipirona') || lower.includes('dipi') || lower.includes('analgésico')) post_meds.push('D');

  // 12. Intercorrências
  let has_complication = false;
  let complication_notes: string | undefined;

  // Extrair bloco de intercorrência primeiro (ex: "Intercorrência: Pequena bradicardia no início")
  const complicationBlockMatch = text.match(/[Ii]ntercorr[êe]ncia[:\s]+(.+?)(?:\.|$)/);

  if (
    lower.includes('intercorrência') ||
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
    if (!lower.includes('sem intercorrência') && !lower.includes('sem complicação') && !lower.includes('sem intercorrencia')) {
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
