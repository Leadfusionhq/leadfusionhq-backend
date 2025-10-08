const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Transaction Receipt PDF (Leadfusionhq)
 * - Header: gradient (#204D9D → #306A64 → #204D9D) + logo (left)
 * - Body: black/white only
 * - Strict table (fixed column widths, clipped text)
 * - Single-page compact layout
 * - Mobile mode (A5 stacked) supported with `mobile: true`
 * - Footer is STICKY at absolute bottom (divider + single thanks line only)
 */
const generateTransactionReceipt = async ({
  transactionId,
  userName,
  userEmail,
  transactionType,
  amount,
  date,
  newBalance,
  oldBalance,
  description = '',
  paymentMethod = '',
  companyName = 'Leadfusionhq',
  companyAddress = '123 Business Street, Suite 100',
  companyCity = 'San Francisco, CA 94102',
  companyPhone = '+1 (555) 123-4567',
  companyEmail = 'support@leadfusionhq.com',
  companyWebsite = 'www.leadfusionhq.com',
  // optional logo
  logoPath = null,
  logoBuffer = null,
  // mobile-friendly layout (A5 stacked)
  mobile = false
}) => {
  return new Promise((resolve, reject) => {
    try {
      // ---------- INIT ----------
      const doc = new PDFDocument({
        size: mobile ? 'A5' : 'A4',
        margin: mobile ? 20 : 38, // compact but readable
        info: {
          Title: `Transaction Receipt - ${transactionId}`,
          Author: companyName,
          Subject: 'Transaction Receipt',
        }
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ---------- HELPERS ----------
      const money = (n) => `$${(Math.abs(Number(n) || 0)).toFixed(2)}`;
      const amountAbs = Math.abs(Number(amount || 0));

      const colors = {
        text: '#111111',
        dim: '#555555',
        grid: '#e5e7eb',
        brand1: '#204D9D',
        brand2: '#306A64'
      };

      // Ellipsize text to prevent overflow
      const ellipsize = (text, fontSize, width, font = 'Helvetica') => {
        if (!text) return '';
        doc.font(font).fontSize(fontSize);
        if (doc.widthOfString(text) <= width) return text;
        const ellipsis = '…';
        let lo = 0, hi = text.length;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          const s = text.slice(0, mid) + ellipsis;
          if (doc.widthOfString(s) <= width) lo = mid + 1;
          else hi = mid;
        }
        return text.slice(0, Math.max(0, lo - 1)) + ellipsis;
      };

      // ---------- STICKY FOOTER METRICS ----------
      // Footer will ALWAYS be drawn at absolute bottom (divider + 1 line)
      const footerHeight = mobile ? 22 : 24;          // divider + thanks line
      const footerTopAbs = doc.page.height - doc.page.margins.bottom - footerHeight;
      const contentLeft = doc.page.margins.left;
      const contentRight = doc.page.width - doc.page.margins.right;
      const reserveBottomForFooter = () => {
        // If content flows too low, clamp y so footer does not go to second page
        if (doc.y > footerTopAbs - 4) doc.y = footerTopAbs - 4;
      };

      // ---------- HEADER (GRADIENT + LOGO) ----------
      const headerH = mobile ? 76 : 90;
      const grad = doc.linearGradient(0, 0, doc.page.width, 0);
      grad.stop(0, colors.brand1).stop(0.5, colors.brand2).stop(1, colors.brand1);
      doc.save();
      doc.rect(0, 0, doc.page.width, headerH).fill(grad);
      doc.restore();

      // Logo (left)
      try {
        const logoY = mobile ? 14 : 16;
        const logoH = mobile ? 36 : 50;
        let drew = false;
        if (logoBuffer) { doc.image(logoBuffer, contentLeft, logoY, { height: logoH }); drew = true; }
        else if (logoPath && fs.existsSync(logoPath)) { doc.image(logoPath, contentLeft, logoY, { height: logoH }); drew = true; }
        else {
          const def = path.join(process.cwd(), 'public', 'images', 'logo.png');
          if (fs.existsSync(def)) { doc.image(def, contentLeft, logoY, { height: logoH }); drew = true; }
        }
        if (!drew) doc.circle(contentLeft + 18, logoY + logoH / 2, mobile ? 11 : 14).fill('#000000');
      } catch (_) {}

      // Company text (white)
      const leftX = contentLeft + (mobile ? 36 : 50) + (mobile ? 10 : 12);
      const rightPadding = doc.page.margins.right;
      const companyBlockW = doc.page.width - leftX - rightPadding - (mobile ? 110 : 150);

      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(mobile ? 15 : 19)
         .text(companyName, leftX, mobile ? 16 : 20, { width: companyBlockW });

      doc.font('Helvetica').fontSize(mobile ? 8 : 9);
      const contactLine = `${companyWebsite} • ${companyEmail} • ${companyPhone}`;
      doc.text(companyAddress, leftX, mobile ? 32 : 36, { width: companyBlockW });
      doc.text(companyCity,    leftX, mobile ? 44 : 48, { width: companyBlockW });
      doc.text(ellipsize(contactLine, mobile ? 8 : 9, companyBlockW), leftX, mobile ? 56 : 60, { width: companyBlockW });

      // RECEIPT label (right)
      doc.font('Helvetica-Bold').fontSize(mobile ? 15 : 19).fillColor('#FFFFFF')
         .text('RECEIPT', doc.page.width - rightPadding - (mobile ? 110 : 150), mobile ? 24 : 30, {
           width: mobile ? 110 : 150, align: 'right'
         });

      // Move below header
      doc.y = headerH + (mobile ? 8 : 10);
      reserveBottomForFooter();

      // Invoice No (right)
      doc.fillColor(colors.dim).font('Helvetica').fontSize(mobile ? 8 : 9)
         .text('Invoice No:', contentRight - (mobile ? 140 : 180), doc.y, {
           width: mobile ? 140 : 180, align: 'right'
         });
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(mobile ? 9 : 10)
         .text(transactionId, contentRight - (mobile ? 140 : 180), doc.y + (mobile ? 10 : 11), {
           width: mobile ? 140 : 180, align: 'right'
         });

      // Divider
      doc.moveDown(mobile ? 0.5 : 1);
      reserveBottomForFooter();
      doc.strokeColor(colors.grid).lineWidth(1)
         .moveTo(contentLeft, doc.y)
         .lineTo(contentRight, doc.y)
         .stroke();

      // ---------- Billed To / Invoice Date ----------
      const blockTop = doc.y + (mobile ? 6 : 8);
      // Billed To
      doc.fillColor(colors.dim).font('Helvetica').fontSize(mobile ? 8 : 9)
         .text('Billed To', contentLeft, blockTop);
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(mobile ? 10 : 11)
         .text(userName || 'Customer', contentLeft, blockTop + (mobile ? 11 : 13));
      doc.fillColor(colors.dim).font('Helvetica').fontSize(mobile ? 8 : 9)
         .text(userEmail || '', contentLeft, blockTop + (mobile ? 21 : 25));
      // Invoice Date (right)
      const rightW = mobile ? 120 : 150;
      doc.fillColor(colors.dim).font('Helvetica').fontSize(mobile ? 8 : 9)
         .text('Invoice Date', contentRight - rightW, blockTop, { width: rightW, align: 'right' });
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(mobile ? 9 : 10)
         .text(date, contentRight - rightW, blockTop + (mobile ? 11 : 13), { width: rightW, align: 'right' });

      doc.y = blockTop + (mobile ? 36 : 42);
      reserveBottomForFooter();

      // Description prep (clip)
      const maxDescChars = mobile ? 60 : 90;
      let desc = (description || transactionType || 'Transaction').trim();
      if (desc.length > maxDescChars) desc = `${desc.slice(0, maxDescChars - 1)}…`;

      // ---------- BODY ----------
      if (!mobile) {
        // DESKTOP strict table
        const tableLeft = contentLeft;
        const tableRight = contentRight;
        const tableWidth = tableRight - tableLeft;
        let y = doc.y;

        // Fixed columns (no overflow)
        const colW = { date: 92, rate: 82, amount: 90, total: 90 };
        colW.desc = tableWidth - (colW.date + colW.rate + colW.amount + colW.total);
        const colX = {
          date: tableLeft,
          desc: tableLeft + colW.date,
          rate: tableLeft + colW.date + colW.desc,
          amount: tableLeft + colW.date + colW.desc + colW.rate,
          total: tableLeft + colW.date + colW.desc + colW.rate + colW.amount
        };

        // Header
        const headerH = 20;
        reserveBottomForFooter();
        doc.fillColor('#f7f7f7').rect(tableLeft, y, tableWidth, headerH).fill();
        doc.strokeColor(colors.grid).rect(tableLeft, y, tableWidth, headerH).stroke();

        doc.fillColor('#444').font('Helvetica-Bold').fontSize(9);
        doc.text('Date', colX.date + 6, y + 4, { width: colW.date - 12, align: 'left' });
        doc.text('Description', colX.desc + 6, y + 4, { width: colW.desc - 12, align: 'left' });
        doc.text('Rate', colX.rate + 6, y + 4, { width: colW.rate - 12, align: 'right' });
        doc.text('Amount', colX.amount + 6, y + 4, { width: colW.amount - 12, align: 'right' });
        doc.text('Total', colX.total + 6, y + 4, { width: colW.total - 12, align: 'right' });

        y += headerH;

        // Row
        const rowH = 22;
        reserveBottomForFooter();
        doc.fillColor('#FFFFFF').rect(tableLeft, y, tableWidth, rowH).fill();
        doc.strokeColor(colors.grid).rect(tableLeft, y, tableWidth, rowH).stroke();

        doc.fillColor(colors.text).font('Helvetica').fontSize(9);
        doc.text(ellipsize(((date || '').split(',')[0] || date || ''), 9, colW.date - 12), colX.date + 6, y + 4, { width: colW.date - 12, align: 'left' });
        doc.text(ellipsize(desc, 9, colW.desc - 12), colX.desc + 6, y + 4, { width: colW.desc - 12, align: 'left' });
        doc.text(ellipsize(money(amountAbs), 9, colW.rate - 12), colX.rate + 6, y + 4, { width: colW.rate - 12, align: 'right' });
        doc.text(ellipsize(money(amountAbs), 9, colW.amount - 12), colX.amount + 6, y + 4, { width: colW.amount - 12, align: 'right' });
        doc.text(ellipsize(money(amountAbs), 9, colW.total - 12), colX.total + 6, y + 4, { width: colW.total - 12, align: 'right' });

        y += rowH + 6;
        doc.y = y;
        reserveBottomForFooter();

        // Totals (right)
        const totalsW = 200;
        const totalsLeft = tableRight - totalsW;
        const lineGap = 12;

        const kv = (k, v, yPos, bold = false) => {
          reserveBottomForFooter();
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(colors.text).fontSize(9);
          doc.text(k, totalsLeft, yPos, { width: 100, align: 'left' });
          doc.text(v, totalsLeft + 100, yPos, { width: 100, align: 'right' });
        };

        kv('SUBTOTAL:', money(amountAbs), doc.y);
        kv('TAX (0%):', money(0), doc.y + lineGap);
        doc.strokeColor(colors.grid).lineWidth(1)
           .moveTo(totalsLeft, doc.y + lineGap + 9)
           .lineTo(totalsLeft + totalsW, doc.y + lineGap + 9)
           .stroke();
        kv('TOTAL:', money(amountAbs), doc.y + lineGap * 2, true);

        // Meta (left)
        doc.y = doc.y + lineGap * 2 + 12;
        reserveBottomForFooter();
        doc.fillColor(colors.dim).font('Helvetica').fontSize(9);
        doc.text(`Payment Method: ${paymentMethod || 'N/A'}`, contentLeft, doc.y);
        doc.y += 10;
        doc.text(`Place of Supply: ${companyCity}`, contentLeft, doc.y);

      } else {
        // MOBILE stacked
        const leftX = contentLeft;
        const rightX = contentRight;

        const row = (label, value, bold = false) => {
          reserveBottomForFooter();
          doc.font('Helvetica').fontSize(9).fillColor(colors.dim)
            .text(label, leftX, doc.y, { width: rightX - leftX });
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(colors.text)
            .text(value, leftX, doc.y + 11, { width: rightX - leftX, align: 'left' });
          doc.y += 22;
        };

        // Divider top
        reserveBottomForFooter();
        doc.strokeColor(colors.grid).lineWidth(1).moveTo(leftX, doc.y).lineTo(rightX, doc.y).stroke();
        doc.y += 6;

        row('Date', ((date || '').split(',')[0] || date || ''));
        row('Description', ellipsize(desc, 9, rightX - leftX));
        row('Rate', money(amountAbs));
        row('Amount', money(amountAbs));
        row('Total', money(amountAbs), true);

        // Divider bottom
        reserveBottomForFooter();
        doc.strokeColor(colors.grid).lineWidth(1).moveTo(leftX, doc.y).lineTo(rightX, doc.y).stroke();
        doc.y += 6;

        // Totals
        const kvR = (k, v, bold = false) => {
          reserveBottomForFooter();
          doc.font('Helvetica').fontSize(9).fillColor(colors.text)
            .text(k, leftX, doc.y, { width: (rightX - leftX) / 2 });
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
            .text(v, leftX + (rightX - leftX) / 2, doc.y, { width: (rightX - leftX) / 2, align: 'right' });
          doc.y += 12;
        };

        kvR('SUBTOTAL:', money(amountAbs));
        kvR('TAX (0%):', money(0));
        reserveBottomForFooter();
        doc.strokeColor(colors.grid).lineWidth(1).moveTo(leftX, doc.y).lineTo(rightX, doc.y).stroke();
        doc.y += 5;
        kvR('TOTAL:', money(amountAbs), true);

        // Meta
        doc.y += 2;
        reserveBottomForFooter();
        doc.fillColor(colors.dim).font('Helvetica').fontSize(9);
        doc.text(`Payment Method: ${paymentMethod || 'N/A'}`, leftX, doc.y); doc.y += 10;
        doc.text(`Place of Supply: ${companyCity}`, leftX, doc.y);
      }

      // ---------- STICKY FOOTER (bottom-anchored, minimal) ----------
      // Always draw footer at absolute footerTopAbs position
      const yFooter = footerTopAbs;

      // Divider
      doc.strokeColor(colors.grid).lineWidth(1)
         .moveTo(contentLeft, yFooter)
         .lineTo(contentRight, yFooter)
         .stroke();

      // Single thanks line
      doc.fillColor(colors.text)
         .font('Helvetica-Bold')
         .fontSize(mobile ? 9.5 : 10)
         .text('Thank you for your business!', contentLeft, yFooter + 6, {
           width: contentRight - contentLeft, align: 'center'
         });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTransactionReceipt };