import * as XLSX from 'xlsx';
import { WordItem, QuizQuestion, Topic } from '../types';
import { splitKhmerWord } from './khmerSplit';

/**
 * Downloads a sample Excel file (.xlsx) with 3 worksheets:
 * 1. ពាក្យពិបាក (Difficult Words)
 * 2. អត្ថបទខ្លី (Short Text / Reading Passages)
 * 3. សំណួរពហុជម្រើស (Multiple Choice Quiz)
 */
export function downloadMultiSheetTemplate(topicName: string = 'គំរូប្រធានបទមេរៀន') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: ពាក្យពិបាក
  const sheet1Data = [
    {
      'ពាក្យ': 'សាលារៀន',
      'ប្រភេទពាក្យ/កម្រិត': 'នាម',
      'និយមន័យ': 'ទីកន្លែងសម្រាប់សិស្សានុសិស្សមកសិក្សាក្រេបជញ្ជក់យកចំណេះដឹង។',
      'ឧទាហរណ៍': 'ខ្ញុំសប្បាយចិត្តណាស់ពេលបានទៅសាលារៀនជារៀងរាល់ថ្ងៃ។'
    },
    {
      'ពាក្យ': 'សៀវភៅ',
      'ប្រភេទពាក្យ/កម្រិត': 'នាម',
      'និយមន័យ': 'ប្រភពនៃចំណេះដឹងដែលផ្ទុកទៅដោយអក្សរ និងរូបភាពសម្រាប់អាន។',
      'ឧទាហរណ៍': 'សិស្សល្អតែងតែចូលចិត្តអានសៀវភៅនៅក្នុងបណ្ណាល័យ។'
    },
    {
      'ពាក្យ': 'គ្រូបង្រៀន',
      'ប្រភេទពាក្យ/កម្រិត': 'នាម',
      'និយមន័យ': 'អ្នកដែលមានតួនាទីបង្ហាត់បង្ហាញ និងផ្ដល់ចំណេះដឹងដល់សិស្សានុសិស្ស។',
      'ឧទាហរណ៍': 'គ្រូបង្រៀនបានណែនាំសិស្សឲ្យខិតខំរៀនសូត្រ។'
    },
    {
      'ពាក្យ': 'សត្វខ្លា',
      'ប្រភេទពាក្យ/កម្រិត': 'នាម',
      'និយមន័យ': 'សត្វចតុបាទ ស៊ីសាច់ជាអាហារ មានសម្បុរលឿងឆ្នូតខ្មៅ ខ្លាំងពូកែ និងកាចសាហាវ។',
      'ឧទាហរណ៍': 'សត្វខ្លាជាស្តេចសម្រឹគកាចសាហាវនៅក្នុងព្រៃធំ។'
    }
  ];
  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  ws1['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'ពាក្យពិបាក');

  // Sheet 2: អត្ថបទខ្លី
  const sheet2Data = [
    {
      'ចំណងជើង/ប្រភេទ': 'អត្ថបទខ្លី ៖ រឿងសាលារៀន',
      'អត្ថបទខ្លី/ល្បះអំណាន': 'សាលារៀនរបស់យើងមានសួនច្បារស្អាត និងមានដើមឈើម្លប់ត្រជាក់។'
    },
    {
      'ចំណងជើង/ប្រភេទ': 'អត្ថបទខ្លី ៖ រឿងថ្ងៃអាទិត្យ',
      'អត្ថបទខ្លី/ល្បះអំណាន': 'នៅថ្ងៃអាទិត្យ ខ្ញុំជួយម៉ាក់ប៉ាសំអាតផ្ទះ និងស្រោចទឹកផ្កា។'
    },
    {
      'ចំណងជើង/ប្រភេទ': 'អត្ថបទខ្លី ៖ រឿងសត្វព្រៃ',
      'អត្ថបទខ្លី/ល្បះអំណាន': 'សត្វតោ និងសត្វដំរី រស់នៅក្នុងព្រៃយ៉ាងមានក្ដីសុខ។'
    },
    {
      'ចំណងជើង/ប្រភេទ': 'អត្ថបទខ្លី ៖ រឿងកូនឆ្មាតូច',
      'អត្ថបទខ្លី/ល្បះអំណាន': 'កូនឆ្មាតូចរត់លេងលើវាលស្មៅពណ៌បៃតងយ៉ាងសប្បាយរីករាយ។'
    }
  ];
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  ws2['!cols'] = [{ wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'អត្ថបទខ្លី');

  // Sheet 3: សំណួរពហុជម្រើស
  const sheet3Data = [
    {
      'សំណួរ': 'តើសត្វមួយណាជាសត្វចតុបាទស៊ីសាច់ជាអាហារ និងមានឆ្នូតខ្មៅលឿង?',
      'ជម្រើសទី១': 'សត្វខ្លា',
      'ជម្រើសទី២': 'ផ្លែស្វាយ',
      'ជម្រើសទី៣': 'ផ្កាឈូក',
      'ជម្រើសទី៤': 'សាលារៀន',
      'ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)': 1,
      'ការពន្យល់': 'សត្វខ្លា គឺជាសត្វចតុបាទស៊ីសាច់ជាអាហារ ដែលមានឆ្នូតរាងកាយពណ៌លឿងខ្មៅយ៉ាងកាចសាហាវ។'
    },
    {
      'សំណួរ': 'តើកន្លែងណាជាទីកន្លែងសម្រាប់សិស្សានុសិស្សក្រេបជញ្ជក់យកចំណេះវិជ្ជា?',
      'ជម្រើសទី១': 'ផ្សារ',
      'ជម្រើសទី២': 'មន្ទីរពេទ្យ',
      'ជម្រើសទី៣': 'សាលារៀន',
      'ជម្រើសទី៤': 'វត្តអារាម',
      'ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)': 3,
      'ការពន្យល់': 'សាលារៀន គឺជាទីកន្លែងសម្រាប់អប់រំ និងបង្រៀនសិស្សានុសិស្សគ្រប់រូប។'
    },
    {
      'សំណួរ': 'តើនរណាជាអ្នកបង្ហាត់បង្ហាញ និងផ្ដល់ចំណេះដឹងដល់សិស្សដោយមិនគិតនឿយហត់?',
      'ជម្រើសទី១': 'មិត្តភក្តិ',
      'ជម្រើសទី២': 'គ្រូបង្រៀន',
      'ជម្រើសទី៣': 'សិស្សរួមថ្នាក់',
      'ជម្រើសទី៤': 'អ្នកលក់ដូរ',
      'ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)': 2,
      'ការពន្យល់': 'គ្រូបង្រៀន គឺជាអ្នកមានគុណបង្រៀនសិស្សានុសិស្សឲ្យមានចំណេះដឹង។'
    }
  ];
  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
  ws3['!cols'] = [{ wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'សំណួរពហុជម្រើស');

  // Save workbook file
  const fileName = `${topicName.replace(/\s+/g, '_')}_Template.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports a Topic into a 3-sheet Excel workbook.
 */
export function exportTopicToMultiSheetExcel(topic: Topic) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: ពាក្យពិបាក
  const sheet1Data = topic.difficultWords.map(item => ({
    'ពាក្យ': item.word || '',
    'ប្រភេទពាក្យ/កម្រិត': item.wordType || '',
    'និយមន័យ': item.definition || '',
    'ឧទាហរណ៍': item.example || ''
  }));
  const ws1 = XLSX.utils.json_to_sheet(sheet1Data.length > 0 ? sheet1Data : [{ 'ពាក្យ': '', 'ប្រភេទពាក្យ/កម្រិត': '', 'និយមន័យ': '', 'ឧទាហរណ៍': '' }]);
  ws1['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'ពាក្យពិបាក');

  // Sheet 2: អត្ថបទខ្លី
  const sheet2Data = topic.shortPassages.map(item => ({
    'ចំណងជើង/ប្រភេទ': item.wordType || '',
    'អត្ថបទខ្លី/ល្បះអំណាន': item.word || ''
  }));
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data.length > 0 ? sheet2Data : [{ 'ចំណងជើង/ប្រភេទ': '', 'អត្ថបទខ្លី/ល្បះអំណាន': '' }]);
  ws2['!cols'] = [{ wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'អត្ថបទខ្លី');

  // Sheet 3: សំណួរពហុជម្រើស
  const sheet3Data = topic.quizQuestions.map(q => ({
    'សំណួរ': q.question || '',
    'ជម្រើសទី១': q.options[0] || '',
    'ជម្រើសទី២': q.options[1] || '',
    'ជម្រើសទី៣': q.options[2] || '',
    'ជម្រើសទី៤': q.options[3] || '',
    'ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)': q.answerIndex + 1,
    'ការពន្យល់': q.explanation || ''
  }));
  const ws3 = XLSX.utils.json_to_sheet(sheet3Data.length > 0 ? sheet3Data : [{
    'សំណួរ': '', 'ជម្រើសទី១': '', 'ជម្រើសទី២': '', 'ជម្រើសទី៣': '', 'ជម្រើសទី៤': '', 'ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)': '', 'ការពន្យល់': ''
  }]);
  ws3['!cols'] = [{ wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'សំណួរពហុជម្រើស');

  const fileName = `${topic.name.replace(/[/\\?%*:|"<>]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Parses an uploaded multi-sheet Excel file into Difficult Words, Short Passages, and Quiz Questions.
 */
export async function parseMultiSheetTopicExcel(file: File): Promise<{
  topicName: string;
  difficultWords: WordItem[];
  shortPassages: WordItem[];
  quizQuestions: QuizQuestion[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const fileName = file.name.replace(/\.[^/.]+$/, '').replace(/_Template$/i, '');
        let topicName = fileName || 'ប្រធានបទថ្មី';

        let difficultWords: WordItem[] = [];
        let shortPassages: WordItem[] = [];
        let quizQuestions: QuizQuestion[] = [];

        // Helper to find sheet by matching keyword
        const findSheet = (keywords: string[]) => {
          for (const sheetName of workbook.SheetNames) {
            const lower = sheetName.toLowerCase();
            if (keywords.some(k => lower.includes(k.toLowerCase()))) {
              return workbook.Sheets[sheetName];
            }
          }
          return null;
        };

        // 1. Parse Sheet 1: ពាក្យពិបាក
        const wsWords = findSheet(['ពាក្យពិបាក', 'ពាក្យ', 'word', 'vocab', 'sheet1']) || workbook.Sheets[workbook.SheetNames[0]];
        if (wsWords) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsWords);
          rows.forEach((row) => {
            const word = (row['ពាក្យ'] || row['ពាក្យពិបាក'] || row['Word'] || row['word'] || '').toString().trim();
            if (!word) return;

            const wordType = (row['ប្រភេទពាក្យ/កម្រិត'] || row['ប្រភេទពាក្យ'] || row['ប្រភេទ'] || row['Type'] || row['type'] || 'ពាក្យពិបាក').toString().trim();
            const definition = (row['និយមន័យ'] || row['អត្ថន័យ'] || row['Definition'] || row['definition'] || '').toString().trim();
            const example = (row['ឧទាហរណ៍'] || row['Example'] || row['example'] || '').toString().trim();

            difficultWords.push({
              word,
              wordType,
              parts: splitKhmerWord(word),
              definition,
              example
            });
          });
        }

        // 2. Parse Sheet 2: អត្ថបទខ្លី
        const wsPassages = findSheet(['អត្ថបទខ្លី', 'អត្ថបទ', 'ល្បះ', 'passage', 'text', 'sentence', 'sheet2']) || 
          (workbook.SheetNames.length > 1 ? workbook.Sheets[workbook.SheetNames[1]] : null);
        
        if (wsPassages && wsPassages !== wsWords) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsPassages);
          rows.forEach((row) => {
            const text = (row['អត្ថបទខ្លី/ល្បះអំណាន'] || row['អត្ថបទខ្លី'] || row['អត្ថបទ'] || row['ល្បះ'] || row['Text'] || row['text'] || row['Passage'] || '').toString().trim();
            if (!text) return;

            const category = (row['ចំណងជើង/ប្រភេទ'] || row['ចំណងជើង'] || row['ប្រភេទ'] || row['Title'] || row['Category'] || 'អត្ថបទខ្លី').toString().trim();

            shortPassages.push({
              word: text,
              wordType: category.startsWith('អត្ថបទ') ? category : `អត្ថបទខ្លី ៖ ${category}`,
              parts: splitKhmerWord(text),
              definition: `ល្បះអំណាន ៖ ${category}`,
              example: text
            });
          });
        }

        // 3. Parse Sheet 3: សំណួរពហុជម្រើស
        const wsQuiz = findSheet(['សំណួរពហុជម្រើស', 'សំណួរ', 'quiz', 'question', 'mcq', 'sheet3']) ||
          (workbook.SheetNames.length > 2 ? workbook.Sheets[workbook.SheetNames[2]] : null);

        if (wsQuiz && wsQuiz !== wsWords && wsQuiz !== wsPassages) {
          const rows: any[] = XLSX.utils.sheet_to_json(wsQuiz);
          rows.forEach((row) => {
            const question = (row['សំណួរ'] || row['សំណួរពហុជម្រើស'] || row['Question'] || row['question'] || '').toString().trim();
            if (!question) return;

            const opt1 = (row['ជម្រើសទី១'] || row['ជម្រើស១'] || row['Option 1'] || row['Option1'] || row['ក'] || '').toString().trim();
            const opt2 = (row['ជម្រើសទី២'] || row['ជម្រើស២'] || row['Option 2'] || row['Option2'] || row['ខ'] || '').toString().trim();
            const opt3 = (row['ជម្រើសទី៣'] || row['ជម្រើស៣'] || row['Option 3'] || row['Option3'] || row['គ'] || '').toString().trim();
            const opt4 = (row['ជម្រើសទី៤'] || row['ជម្រើស៤'] || row['Option 4'] || row['Option4'] || row['ឃ'] || '').toString().trim();

            const options = [opt1, opt2, opt3, opt4].filter(Boolean);
            if (options.length < 2) return;

            // Parse answer index (can be 1, 2, 3, 4 or ក, ខ, គ, ឃ or A, B, C, D)
            const rawAns = (row['ចម្លើយត្រូវ (១-៤ ឬ ក-ឃ)'] || row['ចម្លើយត្រូវ'] || row['ចម្លើយ'] || row['Answer'] || row['answer'] || '1').toString().trim();
            let answerIndex = 0;
            if (['1', '១', 'ក', 'a', 'A'].includes(rawAns)) answerIndex = 0;
            else if (['2', '២', 'ខ', 'b', 'B'].includes(rawAns)) answerIndex = 1;
            else if (['3', '៣', 'គ', 'c', 'C'].includes(rawAns)) answerIndex = 2;
            else if (['4', '៤', 'ឃ', 'd', 'D'].includes(rawAns)) answerIndex = 3;
            else {
              const parsedNum = parseInt(rawAns, 10);
              if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 4) {
                answerIndex = parsedNum - 1;
              }
            }

            const explanation = (row['ការពន្យល់'] || row['ពន្យល់'] || row['Explanation'] || row['explanation'] || '').toString().trim();

            quizQuestions.push({
              question,
              options,
              answerIndex: Math.min(answerIndex, options.length - 1),
              explanation
            });
          });
        }

        resolve({
          topicName,
          difficultWords,
          shortPassages,
          quizQuestions
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
