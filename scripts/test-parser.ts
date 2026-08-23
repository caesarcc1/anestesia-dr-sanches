import { parseWithRegex } from '../src/lib/voice-parser';
import { ParsedVoiceResult } from '../src/types';

interface TestCase {
  name: string;
  input: string;
  expected: Partial<ParsedVoiceResult>;
}

const testCases: TestCase[] = [
  {
    name: 'Caso 1: Hugo (Gato Siamês c/ abreviações e intercorrência)',
    input: 'Animal 2, gato, macho, siamês, Hugo, 4 anos, 2kg, propofol e iso, melox e dipi de pós, orqui. Intercorrência: Pequena bradicardia no início.',
    expected: {
      spoken_order_index: 2,
      species: 'FEL',
      sex: 'M',
      breed: 'Siamês',
      patient_name: 'Hugo',
      weight_kg: 2,
      age: '4 anos',
      anesthesia_drugs: ['P', 'I'],
      post_meds: ['M', 'D'],
      procedure_type: 'ORQ',
      has_complication: true,
      complication_notes: 'Pequena bradicardia no início',
    }
  },
  {
    name: 'Caso 2: Miguel (Galgo Italiano c/ xila e tramal)',
    input: 'Animal 9, cão, macho, galgo italiano, nome Miguel, 24kg, 5 anos, xilazina e tramadol, feito agemoxi no pós, procedimento 2. Sem intercorrências.',
    expected: {
      spoken_order_index: 9,
      species: 'CAN',
      sex: 'M',
      breed: 'Galgo Italiano',
      patient_name: 'Miguel',
      weight_kg: 24,
      age: '5 anos',
      anesthesia_drugs: ['X', 'T'],
      post_meds: ['A'],
      procedure_type: 'OSH',
      has_complication: false,
    }
  },
  {
    name: 'Caso 3: Princesa (Gata SRD c/ dipirona)',
    input: 'Animal 15, gato, fêmea, SRD, princesa, 2kg, 1 ano, propofol e quetamina, dipirona de pós, procedimento 1. Sem intercorrências',
    expected: {
      spoken_order_index: 15,
      species: 'FEL',
      sex: 'F',
      breed: 'SRD',
      patient_name: 'Princesa',
      weight_kg: 2,
      age: '1 ano',
      anesthesia_drugs: ['P', 'K'],
      post_meds: ['D'],
      procedure_type: 'ORQ',
      has_complication: false,
    }
  },
  {
    name: 'Caso 4: Bob (Poodle Macho)',
    input: 'Animal 11, Macho, Poodle, Bob, 12kg, Propofol e Quetamina, Meloxicam de pós, Procedimento 1',
    expected: {
      spoken_order_index: 11,
      species: 'CAN',
      sex: 'M',
      breed: 'Poodle',
      patient_name: 'Bob',
      weight_kg: 12,
      anesthesia_drugs: ['P', 'K'],
      post_meds: ['M'],
      procedure_type: 'ORQ',
    }
  },
  {
    name: 'Caso 5: Mel (Cadela Pitbull Chipada)',
    input: 'Paciente 3 cadela Pitbull Mel 18kg 3 anos Microchip 982000456 Propofol Isoflurano Meloxicam Dipirona OSH',
    expected: {
      spoken_order_index: 3,
      species: 'CAN',
      sex: 'F',
      breed: 'Pitbull',
      patient_name: 'Mel',
      weight_kg: 18,
      age: '3 anos',
      microchip: '982000456',
      anesthesia_drugs: ['P', 'I'],
      post_meds: ['M', 'D'],
      procedure_type: 'OSH',
    }
  },
  {
    name: 'Caso 6: Bento (Shih Tzu c/ Nodulectomia / Procedimento 3)',
    input: 'Animal 1, cão, macho, Shih Tzu, Bento, 6kg, 7 anos, propofol e isoflurano, pós melox e agemoxi, procedimento 3 nodulectomia. Sem intercorrências.',
    expected: {
      spoken_order_index: 1,
      species: 'CAN',
      sex: 'M',
      breed: 'Shih Tzu',
      patient_name: 'Bento',
      weight_kg: 6,
      age: '7 anos',
      anesthesia_drugs: ['P', 'I'],
      post_meds: ['M', 'A'],
      procedure_type: 'OUTROS',
      has_complication: false,
    }
  },
  {
    name: 'Caso 7: Luna (Gata Persa Chipada c/ Hipotermia)',
    input: 'Animal 2, felino, fêmea, persa, Luna, 3.5kg, 3 anos, microchip 982000543210, propofol e quetamina, feito dipirona no pós, OSH. Intercorrência: Hipotermia leve revertida com colchão térmico.',
    expected: {
      spoken_order_index: 2,
      species: 'FEL',
      sex: 'F',
      breed: 'Persa',
      patient_name: 'Luna',
      weight_kg: 3.5,
      age: '3 anos',
      microchip: '982000543210',
      anesthesia_drugs: ['P', 'K'],
      post_meds: ['D'],
      procedure_type: 'OSH',
      has_complication: true,
      complication_notes: 'Hipotermia leve revertida com colchão térmico',
    }
  },
  {
    name: 'Caso 8: Zeus (Rottweiler Pesado c/ Xilazina e Tramal)',
    input: 'Animal 3, canino, macho, Rottweiler, Zeus, 42kg, 4 anos, xila e tramal e propo, agemoxi e melox de pós, castração de macho. Sem intercorrências.',
    expected: {
      spoken_order_index: 3,
      species: 'CAN',
      sex: 'M',
      breed: 'Rottweiler',
      patient_name: 'Zeus',
      weight_kg: 42,
      age: '4 anos',
      anesthesia_drugs: ['X', 'T', 'P'],
      post_meds: ['A', 'M'],
      procedure_type: 'ORQ',
      has_complication: false,
    }
  },
  {
    name: 'Caso 9: Mimi (Gata SRD Filhote c/ Vitamina K e Transamin)',
    input: 'Animal 4, gato, fêmea, SRD, Mimi, 1.8kg, 8 meses, quetamina e transamin e vit k, pós meloxicam e dipirona, procedimento 2. Obs: Sangramento capilar discreto estancado.',
    expected: {
      spoken_order_index: 4,
      species: 'FEL',
      sex: 'F',
      breed: 'SRD',
      patient_name: 'Mimi',
      weight_kg: 1.8,
      age: '8 meses',
      anesthesia_drugs: ['K', 'TM', 'VK'],
      post_meds: ['M', 'D'],
      procedure_type: 'OSH',
      observations: 'Sangramento capilar discreto estancado',
    }
  },
  {
    name: 'Caso 10: Spike (Pinscher Idoso c/ Apneia)',
    input: 'Animal 5, cão, macho, Pinscher, Spike, 3kg, 10 anos, microchip 982000887766, propofol e iso, dipi de pós, orqui. Intercorrência: Apneia transitória após indução.',
    expected: {
      spoken_order_index: 5,
      species: 'CAN',
      sex: 'M',
      breed: 'Pinscher',
      patient_name: 'Spike',
      weight_kg: 3,
      age: '10 anos',
      microchip: '982000887766',
      anesthesia_drugs: ['P', 'I'],
      post_meds: ['D'],
      procedure_type: 'ORQ',
      has_complication: true,
      complication_notes: 'Apneia transitória após indução',
    }
  }
];

console.log('--- INICIANDO TESTES DE SIMULAÇÃO DE VOZ (10 CASOS CLÍNICOS) ---');
let passed = 0;

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const result = parseWithRegex(tc.input);
  console.log(`\n[Teste #${i + 1}] ${tc.name}`);
  console.log(`Frase: "${tc.input}"`);

  let ok = true;
  for (const key of Object.keys(tc.expected) as (keyof ParsedVoiceResult)[]) {
    const expVal = tc.expected[key];
    const gotVal = result[key];
    if (Array.isArray(expVal) && Array.isArray(gotVal)) {
      const match = expVal.every(e => (gotVal as string[]).includes(e));
      if (!match) {
        console.error(`❌ Falha no campo ${key}: esperado ${JSON.stringify(expVal)}, obtido ${JSON.stringify(gotVal)}`);
        ok = false;
      }
    } else if (gotVal !== expVal) {
      console.error(`❌ Falha no campo ${key}: esperado ${String(expVal)}, obtido ${String(gotVal)}`);
      ok = false;
    }
  }

  if (ok) {
    console.log(`✅ [${tc.name}] APROVADO com 100% de precisão!`);
    passed++;
  }
}

console.log(`\n============================================================`);
console.log(`RESULTADO FINAL: ${passed} de ${testCases.length} testes passaram com 100% de sucesso!`);
console.log(`============================================================`);
