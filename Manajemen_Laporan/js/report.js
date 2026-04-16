/**
 * Report Management JavaScript
 * Handles report page initialization and basic interactions
 */

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const reportTitleEl = document.getElementById('reportContentTitle');
const reportPeriodEl = document.getElementById('reportPeriod');
const reportTable = document.getElementById('reportTable');
const reportTableBody = document.getElementById('reportTableBody');
const tableTotalEl = document.getElementById('tableTotal');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const printReportBtn = document.getElementById('printReportBtn');

// ============================================
// INITIALIZATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReportPage);
} else {
    initializeReportPage();
}

function initializeReportPage() {
    setDefaultDateRange();
    initializeEventListeners();
    console.log('Report Page Loaded');
}

function initializeEventListeners() {
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', handleExportPdf);
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', handleExportExcel);
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', handleExportCsv);
    }

    if (printReportBtn) {
        printReportBtn.addEventListener('click', handlePrintReport);
    }
}

// ============================================
// PAGE HELPERS
// ============================================

function setDefaultDateRange() {
    if (!dateFromInput || !dateToInput) return;

    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);

    dateFromInput.valueAsDate = lastMonth;
    dateToInput.valueAsDate = today;
}

function handlePrintReport() {
    openPrintWindow('print');
}

async function handleExportPdf() {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const headers = getTableHeaders();
    const bodyRows = getTableRows();

    try {
        const JsPdf = await ensureJsPdfLoaded();
        const pdf = new JsPdf({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(titleText, 40, 40);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Periode: ${periodText}`, 40, 58);
        pdf.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 40, 74);

        let currentY = 100;

        if (headers.length > 0) {
            const headerLine = headers.join(' | ');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            const wrappedHeaders = pdf.splitTextToSize(headerLine, 760);
            pdf.text(wrappedHeaders, 40, currentY);
            currentY += (wrappedHeaders.length * 12) + 6;
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        if (bodyRows.length === 0) {
            pdf.text('Tidak ada data transaksi untuk ditampilkan.', 40, currentY);
        } else {
            bodyRows.forEach((row) => {
                const rowLine = row.join(' | ');
                const wrappedRow = pdf.splitTextToSize(rowLine, 760);

                if (currentY > 530) {
                    pdf.addPage();
                    currentY = 40;
                }

                pdf.text(wrappedRow, 40, currentY);
                currentY += (wrappedRow.length * 11) + 4;
            });
        }

        if (tableTotalEl && tableTotalEl.textContent.trim()) {
            if (currentY > 560) {
                pdf.addPage();
                currentY = 40;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total: ${tableTotalEl.textContent.trim()}`, 40, currentY + 8);
        }

        pdf.save(`laporan-${generateFileDate()}.pdf`);
        showReportMessage('Export PDF berhasil.', 'success');
    } catch (error) {
        console.error('Export PDF error:', error);
        showReportMessage('Export PDF menggunakan mode print karena library PDF tidak tersedia.', 'warning');
        openPrintWindow('pdf');
    }
}

function handleExportExcel() {
    if (!reportTable) {
        showReportMessage('Tabel laporan tidak ditemukan.', 'error');
        return;
    }

    const htmlContent = buildExcelDocument();
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `laporan-${generateFileDate()}.xls`;
    downloadBlob(blob, filename);
    showReportMessage('Export Excel berhasil.', 'success');
}

function handleExportCsv() {
    if (!reportTable) {
        showReportMessage('Tabel laporan tidak ditemukan.', 'error');
        return;
    }

    const csvRows = [];
    const headers = getTableHeaders();
    const bodyRows = getTableRows();

    if (headers.length > 0) {
        csvRows.push(convertToCsvRow(headers));
    }

    bodyRows.forEach((row) => {
        csvRows.push(convertToCsvRow(row));
    });

    if (tableTotalEl) {
        csvRows.push(convertToCsvRow(['', '', '', 'Total', tableTotalEl.textContent.trim(), '', '', '']));
    }

    const csvContent = `\uFEFF${csvRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `laporan-${generateFileDate()}.csv`;
    downloadBlob(blob, filename);
    showReportMessage('Export CSV berhasil.', 'success');
}

function openPrintWindow(mode) {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
        showReportMessage('Pop-up diblokir browser. Izinkan pop-up untuk print/export PDF.', 'error');
        return;
    }

    const html = buildPrintableDocument(mode);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();

        if (mode === 'pdf') {
            showReportMessage('Dialog print terbuka. Pilih "Save as PDF" untuk menyimpan file PDF.', 'info');
        }
    };
}

function buildPrintableDocument(mode) {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const tableHtml = reportTable ? reportTable.outerHTML : '<p>Tabel laporan tidak tersedia.</p>';
    const generatedAt = new Date().toLocaleString('id-ID');
    const printHeading = mode === 'pdf' ? 'Export PDF Laporan' : 'Print View Laporan';

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(titleText)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 24px;
            color: #1e293b;
        }
        .report-print-header {
            margin-bottom: 16px;
        }
        .report-print-title {
            font-size: 24px;
            margin: 0 0 4px;
        }
        .report-print-subtitle {
            font-size: 14px;
            color: #475569;
            margin: 0;
        }
        .report-print-meta {
            margin: 16px 0;
            font-size: 12px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f1f5f9;
            font-weight: 700;
        }
        tfoot td {
            background: #f8fafc;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <header class="report-print-header">
        <h1 class="report-print-title">${escapeHtml(titleText)}</h1>
        <p class="report-print-subtitle">${escapeHtml(periodText)}</p>
    </header>
    <div class="report-print-meta">
        <span>${escapeHtml(printHeading)}</span>
        <span>Dibuat: ${escapeHtml(generatedAt)}</span>
    </div>
    ${tableHtml}
</body>
</html>`;
}

function buildExcelDocument() {
    const titleText = reportTitleEl ? reportTitleEl.textContent.trim() : 'Laporan';
    const periodText = reportPeriodEl ? reportPeriodEl.textContent.replace(/\s+/g, ' ').trim() : '-';
    const tableHtml = reportTable ? reportTable.outerHTML : '';

    return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        h2 { margin-bottom: 4px; }
        p { margin-top: 0; color: #475569; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <h2>${escapeHtml(titleText)}</h2>
    <p>${escapeHtml(periodText)}</p>
    ${tableHtml}
</body>
</html>`;
}

function getTableHeaders() {
    if (!reportTable) return [];

    const headerElements = reportTable.querySelectorAll('thead th');
    return Array.from(headerElements).map((header) => header.textContent.trim());
}

function getTableRows() {
    if (!reportTable) return [];

    const sourceRows = reportTableBody && reportTableBody.querySelectorAll('tr').length > 0
        ? reportTableBody.querySelectorAll('tr')
        : reportTable.querySelectorAll('tbody tr');

    return Array.from(sourceRows)
        .map((row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map((cell) => cell.textContent.replace(/\s+/g, ' ').trim());
        })
        .filter((row) => row.length > 0 && row.some((cell) => cell !== ''));
}

function convertToCsvRow(rowData) {
    return rowData
        .map((value) => {
            const safeValue = (value ?? '').toString();
            const escaped = safeValue.replace(/"/g, '""');
            return `"${escaped}"`;
        })
        .join(',');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function ensureJsPdfLoaded() {
    return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
            return;
        }

        const existingScript = document.querySelector('script[data-lib="jspdf"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                if (window.jspdf && window.jspdf.jsPDF) {
                    resolve(window.jspdf.jsPDF);
                } else {
                    reject(new Error('jsPDF loaded but unavailable in window scope'));
                }
            });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load jsPDF script')));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        script.setAttribute('data-lib', 'jspdf');
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) {
                resolve(window.jspdf.jsPDF);
                return;
            }

            reject(new Error('jsPDF loaded but unavailable in window scope'));
        };
        script.onerror = () => reject(new Error('Failed to load jsPDF script'));
        document.head.appendChild(script);
    });
}

function generateFileDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${date}-${hours}${minutes}`;
}

function escapeHtml(value) {
    if (!value) return '';

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showReportMessage(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    if (type === 'error' || type === 'warning') {
        alert(message);
        return;
    }

    console.log(message);
}
