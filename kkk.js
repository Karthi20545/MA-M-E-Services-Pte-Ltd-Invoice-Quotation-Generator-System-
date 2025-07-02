// Initialize signature pads
let signaturePadTech, signaturePadCust;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize signature pads
    const canvasTech = document.getElementById('signature-pad-tech');
    const canvasCust = document.getElementById('signature-pad-cust');
    
    if (canvasTech && canvasCust) {
        signaturePadTech = new SignaturePad(canvasTech);
        signaturePadCust = new SignaturePad(canvasCust);
        
        // Adjust canvas scaling for high DPI displays
        function resizeCanvas(canvas) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
        }
        
        resizeCanvas(canvasTech);
        resizeCanvas(canvasCust);
        
        window.addEventListener('resize', function() {
            resizeCanvas(canvasTech);
            resizeCanvas(canvasCust);
        });
    }

    // Set today's date as default
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('documentDate').value = formattedDate;
    document.getElementById('report-date').value = formattedDate;
    document.getElementById('tech-date').value = formattedDate;
    document.getElementById('cust-date').value = formattedDate;
    
    // Initialize event listeners for existing items
    initializeItemRows();

    // Add item button click handler
    document.getElementById('addItemBtn').addEventListener('click', addNewItemRow);
    
    // Print button click handler
    document.getElementById('printBtn').addEventListener('click', printDocument);
    
    // Save button click handler
    document.getElementById('saveBtn').addEventListener('click', saveDocument);
    
    // Reset button click handler
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Logo upload handler
    document.getElementById('companyLogo').addEventListener('change', handleLogoUpload);
    
    // GST rate change handler
    document.getElementById('gstRate').addEventListener('change', function() {
        calculateTotals();
    });
    
    // Load history
    loadHistory();
    
    // Calculate totals for initial row
    calculateRowTotal(document.querySelector('#itemsTableBody tr'));
});

// Initialize event listeners for item rows
function initializeItemRows() {
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.quantity');
        const rateInput = row.querySelector('.rate');
        const gstInput = row.querySelector('.gst-percent');
        
        qtyInput.addEventListener('input', () => calculateRowTotal(row));
        rateInput.addEventListener('input', () => calculateRowTotal(row));
        gstInput.addEventListener('input', () => calculateRowTotal(row));
        
        row.querySelector('.remove-item').addEventListener('click', () => {
            row.remove();
            renumberRows();
            calculateTotals();
        });
    });
}

// Add new item row
function addNewItemRow() {
    const tbody = document.getElementById('itemsTableBody');
    const newRow = document.createElement('tr');
    const rowCount = tbody.children.length + 1;
    const gstRate = document.getElementById('gstRate').value || 8;
    
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><textarea class="form-control item-desc" rows="4" placeholder="Item description"></textarea></td>
        <td><input type="number" class="form-control quantity" min="1" value="1"></td>
        <td><input type="number" class="form-control rate" min="0" step="0.01" value="0.00"></td>
        <td><input type="number" class="form-control gst-percent" min="0" max="100" step="0.01" value="${gstRate}"></td>
        <td><input type="text" class="form-control-plaintext amount" value="$0.00" readonly></td>
        <td><button class="btn btn-danger btn-sm remove-item">X</button></td>
    `;
    
    tbody.appendChild(newRow);
    
    // Initialize event listeners for the new row
    const qtyInput = newRow.querySelector('.quantity');
    const rateInput = newRow.querySelector('.rate');
    const gstInput = newRow.querySelector('.gst-percent');
    
    qtyInput.addEventListener('input', () => calculateRowTotal(newRow));
    rateInput.addEventListener('input', () => calculateRowTotal(newRow));
    gstInput.addEventListener('input', () => calculateRowTotal(newRow));
    
    newRow.querySelector('.remove-item').addEventListener('click', () => {
        newRow.remove();
        renumberRows();
        calculateTotals();
    });
}

// Calculate row total with GST
function calculateRowTotal(row) {
    const qty = parseFloat(row.querySelector('.quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const gstPercent = parseFloat(row.querySelector('.gst-percent').value) || 0;
    
    const subtotal = qty * rate;
    const gstAmount = subtotal * (gstPercent / 100);
    const total = subtotal + gstAmount;
    
    row.querySelector('.amount').value = formatCurrency(total);
    calculateTotals();
}

// Renumber rows after deletion
function renumberRows() {
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

// Calculate subtotal, GST, and grand total
function calculateTotals() {
    const amounts = Array.from(document.querySelectorAll('#itemsTableBody .amount')).map(el => {
        const value = el.value.replace(/[^0-9.-]+/g,"");
        return parseFloat(value) || 0;
    });
    
    const subtotal = amounts.reduce((sum, amount) => sum + amount, 0);
    const gstRate = parseFloat(document.getElementById('gstRate').value) || 0;
    
    // Update the template values (even though it's hidden)
    document.getElementById('qtSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('qtGstRate').textContent = gstRate;
    document.getElementById('qtGst').textContent = formatCurrency(subtotal * (gstRate / 100));
    document.getElementById('qtGrandTotal').textContent = formatCurrency(subtotal * (1 + gstRate / 100));
    document.getElementById('qtAmountInWords').textContent = numberToWords(subtotal * (1 + gstRate / 100)) + ' Dollars Only';
}

// Format currency
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Number to words conversion
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    num = Math.floor(num);
    
    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    
    let words = '';
    if (num < 100) {
        words = tens[Math.floor(num / 10)];
        if (num % 10 !== 0) {
            words += ' ' + ones[num % 10];
        }
        return words;
    }
    
    if (num < 1000) {
        words = ones[Math.floor(num / 100)] + ' Hundred';
        if (num % 100 !== 0) {
            words += ' and ' + numberToWords(num % 100);
        }
        return words;
    }
    
    if (num < 1000000) {
        words = numberToWords(Math.floor(num / 1000)) + ' Thousand';
        if (num % 1000 !== 0) {
            words += ' ' + numberToWords(num % 1000);
        }
        return words;
    }
    
    if (num < 1000000000) {
        words = numberToWords(Math.floor(num / 1000000)) + ' Million';
        if (num % 1000000 !== 0) {
            words += ' ' + numberToWords(num % 1000000);
        }
        return words;
    }
    
    return 'Number too large';
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logoPreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        
        // Also update the template logo
        document.getElementById('qtCompanyLogo').src = e.target.result;
        document.getElementById('srCompanyLogo').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Print document
function printDocument() {
    // Update the template with current values
    updateTemplate();
    
    // Show the template and hide other elements
    document.getElementById('documentTemplate').classList.remove('d-none');
    
    // Print
    window.print();
    
    // Hide the template again
    document.getElementById('documentTemplate').classList.add('d-none');
}

// Update template with current values
function updateTemplate() {
    // Company info
    document.getElementById('qtCompanyName').textContent = document.getElementById('companyName').value;
    document.getElementById('qtCompanyUen').textContent = 'UEN: ' + document.getElementById('companyUen').value;
    document.getElementById('qtCompanyOffice').textContent = 'Office: ' + document.getElementById('companyOffice').value;
    document.getElementById('qtCompanyAddress').textContent = 'Address: ' + document.getElementById('companyAddress').value;
    document.getElementById('qtGstRegNo').textContent = document.getElementById('gstRegistration').value;
    
    // Customer info
    document.getElementById('qtCustomerName').textContent = document.getElementById('customerName').value;
    document.getElementById('qtCustomerAddress').textContent = document.getElementById('customerAddress').value;
    document.getElementById('qtCustomerAttn').textContent = document.getElementById('customerAttn').value;
    document.getElementById('qtCustomerTel').textContent = document.getElementById('customerTel').value;
    
    // Document info
    document.getElementById('qtDocumentDate').textContent = formatDate(document.getElementById('documentDate').value);
    document.getElementById('qtDocumentNumber').textContent = document.getElementById('documentNumber').value;
    document.getElementById('qtYourRef').textContent = document.getElementById('yourRef').value;
    document.getElementById('qtOurRef').textContent = document.getElementById('ourRef').value;
    document.getElementById('qtTerms').textContent = document.getElementById('terms').value;
    document.getElementById('qtPageInfo').textContent = document.getElementById('pageInfo').value;
    
    // Items
    const tbody = document.getElementById('qtItemsTableBody');
    tbody.innerHTML = '';
    
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach(row => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${row.cells[0].textContent}</td>
            <td style="white-space: pre-line;">${row.querySelector('.item-desc').value}</td>
            <td>${row.querySelector('.quantity').value}</td>
            <td>${formatCurrency(parseFloat(row.querySelector('.rate').value)) || 0}</td>
            <td>${row.querySelector('.gst-percent').value}%</td>
            <td>${row.querySelector('.amount').value}</td>)
        `;
        tbody.appendChild(newRow);
    });
    
    // Notes
    document.getElementById('qtNotes').innerHTML = document.getElementById('notes').value.replace(/\n/g, '<br>');
    
    // Signature
    document.getElementById('qtSignatoryName').textContent = document.getElementById('signatoryName').value || 'Authorized Signature';
    
    // Calculate totals (in case they weren't updated)
    calculateTotals();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Save document
function saveDocument() {
    updateTemplate();
    
    const invoiceData = {
        company: {
            name: document.getElementById('companyName').value,
            uen: document.getElementById('companyUen').value,
            logo: document.getElementById('logoPreview').src,
            office: document.getElementById('companyOffice').value,
            address: document.getElementById('companyAddress').value,
            gstRate: parseFloat(document.getElementById('gstRate').value) || 0,
            gstRegistration: document.getElementById('gstRegistration').value
        },
        customer: {
            name: document.getElementById('customerName').value,
            attn: document.getElementById('customerAttn').value,
            tel: document.getElementById('customerTel').value,
            address: document.getElementById('customerAddress').value
        },
        document: {
            date: document.getElementById('documentDate').value,
            number: document.getElementById('documentNumber').value,
            yourRef: document.getElementById('yourRef').value,
            ourRef: document.getElementById('ourRef').value,
            terms: document.getElementById('terms').value,
            pageInfo: document.getElementById('pageInfo').value,
            notes: document.getElementById('notes').value,
            signatory: document.getElementById('signatoryName').value
        },
        items: Array.from(document.querySelectorAll('#itemsTableBody tr')).map(row => ({
            description: row.querySelector('.item-desc').value,
            quantity: row.querySelector('.quantity').value,
            rate: row.querySelector('.rate').value,
            gstPercent: row.querySelector('.gst-percent').value,
            amount: row.querySelector('.amount').value
        })),
        totals: {
            subtotal: document.getElementById('qtSubtotal').textContent,
            gstRate: document.getElementById('qtGstRate').textContent,
            gst: document.getElementById('qtGst').textContent,
            grandTotal: document.getElementById('qtGrandTotal').textContent,
            amountInWords: document.getElementById('qtAmountInWords').textContent
        },
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    invoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    
    alert('Invoice saved successfully!');
    loadHistory();
}

// Reset form
function resetForm() {
    if (confirm('Are you sure you want to reset the form? All unsaved data will be lost.')) {
        document.getElementById('customerName').value = '';
        document.getElementById('customerAttn').value = '';
        document.getElementById('customerTel').value = '';
        document.getElementById('customerAddress').value = '';
        
        const tbody = document.getElementById('itemsTableBody');
        tbody.innerHTML = `
            <tr>
                <td>1</td>
                <td><textarea class="form-control item-desc" rows="4" placeholder="Item description"></textarea></td>
                <td><input type="number" class="form-control quantity" min="1" value="1"></td>
                <td><input type="number" class="form-control rate" min="0" step="0.01" value="0.00"></td>
                <td><input type="number" class="form-control gst-percent" min="0" max="100" step="0.01" value="8"></td>
                <td><input type="text" class="form-control-plaintext amount" value="$0.00" readonly></td>
                <td><button class="btn btn-danger btn-sm remove-item">X</button></td>
            </tr>
        `;
        
        // Set today's date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('documentDate').value = formattedDate;
        
        document.getElementById('documentNumber').value = '';
        document.getElementById('yourRef').value = '';
        document.getElementById('ourRef').value = '';
        document.getElementById('terms').value = '30 Days';
        document.getElementById('pageInfo').value = '01 of 01';
        document.getElementById('notes').value = `1. All cheques should be crossed and made payable to MA M&E SERVICES PTE LTD.

2. Please include the invoice number on your check.

3. Goods are neither returnable nor refundable.

4. All the online transaction

CURRENT ACCOUNT: 12345678 11111 or via pay now to UEN no: 12345678901111`;
        document.getElementById('signatoryName').value = '';
        document.getElementById('gstRate').value = '8';
        document.getElementById('gstRegistration').value = '';
        
        // Reinitialize the first row
        initializeItemRows();
        calculateTotals();
    }
}

// Clear signature
function clearSignature(type) {
    if (type === 'tech') {
        signaturePadTech.clear();
    } else {
        signaturePadCust.clear();
    }
}

// Save service report
function saveServiceReport() {
    const serviceReportData = {
        customer: {
            name: document.getElementById('customer-name').value,
            address: document.getElementById('customer-address').value
        },
        report: {
            number: document.getElementById('sr-number').value,
            date: document.getElementById('report-date').value,
            location: document.getElementById('location').value,
            attendedBy: document.getElementById('attended-by').value,
            equipmentType: document.getElementById('equipment-type').value,
            modelSerial: document.getElementById('model-serial').value,
            timeIn: document.getElementById('time-in').value,
            timeOut: document.getElementById('time-out').value
        },
        problem: {
            breakdownCall: document.getElementById('breakdown-call').checked,
            repairMod: document.getElementById('repair-mod').checked,
            installEquip: document.getElementById('install-equip').checked,
            siteInspect: document.getElementById('site-inspect').checked,
            preventMain: document.getElementById('prevent-main').checked,
            testComm: document.getElementById('test-comm').checked,
            natureComplaint: document.getElementById('nature-complaint').value,
            asdWork: document.getElementById('asd-work').checked
        },
        service: {
            rendered: document.getElementById('service-rendered').value,
            materials: document.getElementById('materials-supplied').value,
            remarks: document.getElementById('remarks').value
        },
        signatures: {
            tech: {
                signature: signaturePadTech.isEmpty() ? null : signaturePadTech.toDataURL(),
                name: document.getElementById('tech-name').value,
                date: document.getElementById('tech-date').value
            },
            cust: {
                signature: signaturePadCust.isEmpty() ? null : signaturePadCust.toDataURL(),
                name: document.getElementById('cust-name').value,
                date: document.getElementById('cust-date').value
            }
        },
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    let serviceReports = JSON.parse(localStorage.getItem('serviceReports')) || [];
    serviceReports.push(serviceReportData);
    localStorage.setItem('serviceReports', JSON.stringify(serviceReports));
    
    alert('Service report saved successfully!');
    loadHistory();
}

// Print service report
function printServiceReport() {
    // Update the service report template with current values
    updateServiceReportTemplate();
    
    // Show the template and hide other elements
    document.getElementById('serviceReportTemplate').classList.remove('d-none');
    
    // Print
    window.print();
    
    // Hide the template again
    document.getElementById('serviceReportTemplate').classList.add('d-none');
}

// Update service report template
function updateServiceReportTemplate() {
    // Customer info
    document.getElementById('srCustomerName').textContent = document.getElementById('customer-name').value;
    document.getElementById('srCustomerAddress').textContent = document.getElementById('customer-address').value;
    
    // Report info
    document.getElementById('srNumber').textContent = document.getElementById('sr-number').value;
    document.getElementById('srDate').textContent = formatDate(document.getElementById('report-date').value);
    document.getElementById('srLocation').textContent = document.getElementById('location').value;
    document.getElementById('srAttendedBy').textContent = document.getElementById('attended-by').value;
    
    // Equipment info
    document.getElementById('srEquipmentType').textContent = document.getElementById('equipment-type').value;
    document.getElementById('srModelSerial').textContent = document.getElementById('model-serial').value;
    
    // Time info
    document.getElementById('srTimeIn').textContent = document.getElementById('time-in').value;
    document.getElementById('srTimeOut').textContent = document.getElementById('time-out').value;
    
    // Problem info
    const problemTypes = [];
    if (document.getElementById('breakdown-call').checked) problemTypes.push('Breakdown Call');
    if (document.getElementById('repair-mod').checked) problemTypes.push('Repair/Modification');
    if (document.getElementById('install-equip').checked) problemTypes.push('Installation of Equipment');
    if (document.getElementById('site-inspect').checked) problemTypes.push('Site Inspection');
    if (document.getElementById('prevent-main').checked) problemTypes.push('Preventive Maintenance');
    if (document.getElementById('test-comm').checked) problemTypes.push('Testing & Commissioning');
    
    document.getElementById('srNatureOfProblem').textContent = problemTypes.join(', ');
    document.getElementById('srAsdWork').textContent = document.getElementById('asd-work').checked ? 'Yes' : 'No';
    
    // Nature of complaint
    document.getElementById('srNatureComplaint').textContent = document.getElementById('nature-complaint').value;
    
    // Service details
    document.getElementById('srServiceRendered').textContent = document.getElementById('service-rendered').value;
    document.getElementById('srMaterialsSupplied').textContent = document.getElementById('materials-supplied').value;
    document.getElementById('srRemarks').textContent = document.getElementById('remarks').value;
    
    // Signatures
    document.getElementById('srTechName').textContent = document.getElementById('tech-name').value;
    document.getElementById('srTechDate').textContent = formatDate(document.getElementById('tech-date').value);
    document.getElementById('srCustName').textContent = document.getElementById('cust-name').value;
    document.getElementById('srCustDate').textContent = formatDate(document.getElementById('cust-date').value);
}

// Clear service report form
function clearServiceReport() {
    if (confirm('Are you sure you want to clear the service report form? All unsaved data will be lost.')) {
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('sr-number').value = '';
        
        // Set today's date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('report-date').value = formattedDate;
        document.getElementById('tech-date').value = formattedDate;
        document.getElementById('cust-date').value = formattedDate;
        
        document.getElementById('location').value = '';
        document.getElementById('attended-by').value = '';
        document.getElementById('equipment-type').value = '';
        document.getElementById('model-serial').value = '';
        document.getElementById('time-in').value = '';
        document.getElementById('time-out').value = '';
        
        // Clear checkboxes
        document.getElementById('breakdown-call').checked = false;
        document.getElementById('repair-mod').checked = false;
        document.getElementById('install-equip').checked = false;
        document.getElementById('site-inspect').checked = false;
        document.getElementById('prevent-main').checked = false;
        document.getElementById('test-comm').checked = false;
        document.getElementById('asd-work').checked = false;
        
        document.getElementById('nature-complaint').value = '';
        document.getElementById('service-rendered').value = '';
        document.getElementById('materials-supplied').value = '';
        document.getElementById('remarks').value = '';
        
        document.getElementById('tech-name').value = '';
        document.getElementById('cust-name').value = '';
        
        // Clear signatures
        signaturePadTech.clear();
        signaturePadCust.clear();
    }
}

// Load history
function loadHistory() {
    // Load invoices
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const invoiceList = document.getElementById('invoiceHistoryList');
    invoiceList.innerHTML = '';
    
    if (invoices.length === 0) {
        invoiceList.innerHTML = '<p>No saved invoices found.</p>';
    } else {
        invoices.forEach((invoice, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${invoice.document.number}</strong> - ${invoice.customer.name}
                        <div class="text-muted small">${formatDate(invoice.document.date)} - ${invoice.document.signatory || 'No signatory'}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary me-1 view-invoice" data-index="${index}">View</button>
                        <button class="btn btn-sm btn-danger delete-invoice" data-index="${index}">Delete</button>
                    </div>
                </div>
                <div class="invoice-details mt-2 d-none" id="invoice-details-${index}">
                    <div class="card card-body">
                        <p><strong>Customer:</strong> ${invoice.customer.name}</p>
                        <p><strong>Date:</strong> ${formatDate(invoice.document.date)}</p>
                        <p><strong>Total:</strong> ${invoice.totals.grandTotal}</p>
                        <button class="btn btn-sm btn-success print-invoice" data-index="${index}">Print</button>
                    </div>
                </div>
            `;
            invoiceList.appendChild(item);
        });
        
        // Add event listeners for view buttons
        document.querySelectorAll('.view-invoice').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const details = document.getElementById(`invoice-details-${index}`);
                details.classList.toggle('d-none');
            });
        });
        
        // Add event listeners for print buttons
        document.querySelectorAll('.print-invoice').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const invoices = JSON.parse(localStorage.getItem('invoices'));
                const invoice = invoices[index];
                printSavedInvoice(invoice);
            });
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-invoice').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                if (confirm('Are you sure you want to delete this invoice?')) {
                    const invoices = JSON.parse(localStorage.getItem('invoices'));
                    invoices.splice(index, 1);
                    localStorage.setItem('invoices', JSON.stringify(invoices));
                    loadHistory();
                }
            });
        });
    }
    
    // Load service reports
    const serviceReports = JSON.parse(localStorage.getItem('serviceReports')) || [];
    const reportList = document.getElementById('reportHistoryList');
    reportList.innerHTML = '';
    
    if (serviceReports.length === 0) {
        reportList.innerHTML = '<p>No saved service reports found.</p>';
    } else {
        serviceReports.forEach((report, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${report.report.number}</strong> - ${report.customer.name}
                        <div class="text-muted small">${formatDate(report.report.date)} - ${report.report.attendedBy || 'No technician'}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-primary me-1 view-report" data-index="${index}">View</button>
                        <button class="btn btn-sm btn-danger delete-report" data-index="${index}">Delete</button>
                    </div>
                </div>
                <div class="report-details mt-2 d-none" id="report-details-${index}">
                    <div class="card card-body">
                        <p><strong>Customer:</strong> ${report.customer.name}</p>
                        <p><strong>Date:</strong> ${formatDate(report.report.date)}</p>
                        <p><strong>Location:</strong> ${report.report.location}</p>
                        <button class="btn btn-sm btn-success print-report" data-index="${index}">Print</button>
                    </div>
                </div>
            `;
            reportList.appendChild(item);
        });
        
        // Add event listeners for view buttons
        document.querySelectorAll('.view-report').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const details = document.getElementById(`report-details-${index}`);
                details.classList.toggle('d-none');
            });
        });
        
        // Add event listeners for print buttons
        document.querySelectorAll('.print-report').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const serviceReports = JSON.parse(localStorage.getItem('serviceReports'));
                const report = serviceReports[index];
                printSavedServiceReport(report);
            });
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-report').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                if (confirm('Are you sure you want to delete this service report?')) {
                    const serviceReports = JSON.parse(localStorage.getItem('serviceReports'));
                    serviceReports.splice(index, 1);
                    localStorage.setItem('serviceReports', JSON.stringify(serviceReports));
                    loadHistory();
                }
            });
        });
    }
}

// Print saved invoice
function printSavedInvoice(invoice) {
    // Update the template with saved invoice data
    document.getElementById('qtCompanyName').textContent = invoice.company.name;
    document.getElementById('qtCompanyUen').textContent = 'UEN: ' + invoice.company.uen;
    document.getElementById('qtCompanyOffice').textContent = 'Office: ' + invoice.company.office;
    document.getElementById('qtCompanyAddress').textContent = 'Address: ' + invoice.company.address;
    document.getElementById('qtGstRegNo').textContent = invoice.company.gstRegistration || '';
    
    if (invoice.company.logo) {
        document.getElementById('qtCompanyLogo').src = invoice.company.logo;
    }
    
    document.getElementById('qtCustomerName').textContent = invoice.customer.name;
    document.getElementById('qtCustomerAddress').textContent = invoice.customer.address;
    document.getElementById('qtCustomerAttn').textContent = invoice.customer.attn;
    document.getElementById('qtCustomerTel').textContent = invoice.customer.tel;
    
    document.getElementById('qtDocumentDate').textContent = formatDate(invoice.document.date);
    document.getElementById('qtDocumentNumber').textContent = invoice.document.number;
    document.getElementById('qtYourRef').textContent = invoice.document.yourRef;
    document.getElementById('qtOurRef').textContent = invoice.document.ourRef;
    document.getElementById('qtTerms').textContent = invoice.document.terms;
    document.getElementById('qtPageInfo').textContent = invoice.document.pageInfo;
    
    const tbody = document.getElementById('qtItemsTableBody');
    tbody.innerHTML = '';
    
    invoice.items.forEach((item, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td style="white-space: pre-line;">${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(parseFloat(item.rate)) || 0}</td>
            <td>${item.gstPercent}%</td>
            <td>${item.amount}</td>
        `;
        tbody.appendChild(newRow);
    });
    
    document.getElementById('qtNotes').innerHTML = invoice.document.notes.replace(/\n/g, '<br>');
    document.getElementById('qtSignatoryName').textContent = invoice.document.signatory || 'Authorized Signature';
    
    document.getElementById('qtSubtotal').textContent = invoice.totals.subtotal;
    document.getElementById('qtGstRate').textContent = invoice.company.gstRate || 0;
    document.getElementById('qtGst').textContent = invoice.totals.gst;
    document.getElementById('qtGrandTotal').textContent = invoice.totals.grandTotal;
    document.getElementById('qtAmountInWords').textContent = invoice.totals.amountInWords;
    
    // Show the template and print
    document.getElementById('documentTemplate').classList.remove('d-none');
    window.print();
    document.getElementById('documentTemplate').classList.add('d-none');
}

// Print saved service report
function printSavedServiceReport(report) {
    // Update the template with saved report data
    document.getElementById('srCustomerName').textContent = report.customer.name;
    document.getElementById('srCustomerAddress').textContent = report.customer.address;
    
    document.getElementById('srNumber').textContent = report.report.number;
    document.getElementById('srDate').textContent = formatDate(report.report.date);
    document.getElementById('srLocation').textContent = report.report.location;
    document.getElementById('srAttendedBy').textContent = report.report.attendedBy;
    
    document.getElementById('srEquipmentType').textContent = report.report.equipmentType;
    document.getElementById('srModelSerial').textContent = report.report.modelSerial;
    
    document.getElementById('srTimeIn').textContent = report.report.timeIn;
    document.getElementById('srTimeOut').textContent = report.report.timeOut;
    
    const problemTypes = [];
    if (report.problem.breakdownCall) problemTypes.push('Breakdown Call');
    if (report.problem.repairMod) problemTypes.push('Repair/Modification');
    if (report.problem.installEquip) problemTypes.push('Installation of Equipment');
    if (report.problem.siteInspect) problemTypes.push('Site Inspection');
    if (report.problem.preventMain) problemTypes.push('Preventive Maintenance');
    if (report.problem.testComm) problemTypes.push('Testing & Commissioning');
    
    document.getElementById('srNatureOfProblem').textContent = problemTypes.join(', ');
    document.getElementById('srAsdWork').textContent = report.problem.asdWork ? 'Yes' : 'No';
    
    document.getElementById('srNatureComplaint').textContent = report.problem.natureComplaint;
    document.getElementById('srServiceRendered').textContent = report.service.rendered;
    document.getElementById('srMaterialsSupplied').textContent = report.service.materials;
    document.getElementById('srRemarks').textContent = report.service.remarks;
    
    document.getElementById('srTechName').textContent = report.signatures.tech.name;
    document.getElementById('srTechDate').textContent = formatDate(report.signatures.tech.date);
    document.getElementById('srCustName').textContent = report.signatures.cust.name;
    document.getElementById('srCustDate').textContent = formatDate(report.signatures.cust.date);
    
    // Show the template and print
    document.getElementById('serviceReportTemplate').classList.remove('d-none');
    window.print();
    document.getElementById('serviceReportTemplate').classList.add('d-none');
}
        