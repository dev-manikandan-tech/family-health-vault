import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { IPdfGenerator } from '../../domain/services/pdf-generator.interface';
import { TimelineEvent } from '../../domain/entities/timeline-event.entity';

@Injectable()
export class PdfLibGenerator implements IPdfGenerator {
  async generateTimelinePdf(
    profileName: string,
    events: TimelineEvent[],
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage();
    const { width: _width, height } = page.getSize();
    let y = height - 50;

    page.drawText(`Health Timeline - ${profileName}`, {
      x: 50,
      y,
      size: 18,
      font,
    });
    y -= 30;

    for (const event of events) {
      if (y < 80) {
        page = pdfDoc.addPage();
        y = height - 50;
      }
      const date = event.eventDate.toISOString().split('T')[0];
      const line = `[${date}] ${event.eventType.toUpperCase()}: ${event.title}`;
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 20;
      if (event.description) {
        page.drawText(event.description, { x: 70, y, size: 9, font });
        y -= 15;
      }
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }
}
