import { parseWithRegex } from '../src/lib/voice-parser';
import { ParsedVoiceResult } from '../src/types';

interface TestCase {
  input: string;
  expected: Partial<ParsedVoiceResult>;
}

const testCases: TestCase[] = [
  {
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
    input: 'Gato macho siamês Thor 4kg 2 anos quetamina e xilazina pós agemoxi e meloxicam com intercorrência hipotermia',
    expected: {
      species: 'FEL',
      sex: 'M',
      breed: 'Siamês',
      patient_name: 'Thor',
      weight_kg: 4,
      anesthesia_drugs: ['K', 'X'],
      post_meds: ['A', 'M'],
      has_complication: true,
    }
  }
];

console.log('--- INICIANDO TESTES DE SIMULAÇÃO DE VOZ ---');
let passed = 0;

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const result = parseWithRegex(tc.input);
  console.log(`\n[Teste #${i + 1}] Frase: "${tc.input}"`);

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
    console.log(`✅ Teste #${i + 1} APROVADO com 100% de precisão!`);
    passed++;
  }
}

console.log(`\n========================================`);
console.log(`RESULTADO FINAL: ${passed} de ${testCases.length} testes passaram com sucesso!`);
console.log(`========================================`);
