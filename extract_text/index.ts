import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    const { pdf_url, row_id } = await req.json();

    // Download the PDF from Supabase Storage
    const response = await fetch(pdf_url);
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Extract text from each page
    let extractedText = '';
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      extractedText += pdfDoc.getPage(i).getText() + '\n\n';
    }

    // Update Supabase row with extracted text
    await supabase
      .from('public.uploads')
      .update({ text: extractedText })
      .eq('supaid', row_id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return res.status(500).json({ error: 'Failed to extract text' });
  }
}

