
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseCsvFile = (file) => new Promise((resolve, reject) => {
  Papa.parse(file, { header: true, skipEmptyLines: true, complete: (res) => resolve(res.data), error: reject });
});

export const parseXlsxFile = async (file) => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
};