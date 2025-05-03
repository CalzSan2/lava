document.addEventListener('DOMContentLoaded', () => {
    const carNameInput = document.getElementById('carName');
    const washTypeSelect = document.getElementById('washType');
    const addWashButton = document.getElementById('addWash');
    const washListTableBody = document.getElementById('washList');
    const closeRegisterButton = document.getElementById('closeRegister');
    const totalRevenueSpan = document.getElementById('totalRevenue');
    const totalCarsSpan = document.getElementById('totalCars');
    const paymentSummaryDiv = document.getElementById('paymentSummary');
    const paymentDetailsDiv = document.getElementById('paymentDetails');
    const registerSummaryDiv = document.getElementById('registerSummary'); 
    const registerSummaryDetailsDiv = document.getElementById('registerSummaryDetails'); 
    const liveSummaryDiv = document.getElementById('liveSummary'); 

    let recordedWashes = [];
    let totalRevenue = 0;
    let totalCars = 0;
    let isRegisterClosed = false; 

    addWashButton.addEventListener('click', addWash);
    closeRegisterButton.addEventListener('click', closeRegister);

    function addWash() {
        if (isRegisterClosed) {
            alert("O caixa já foi fechado. Não é possível adicionar novas lavagens.");
            return;
        }
        const carName = carNameInput.value.trim();
        const selectedOption = washTypeSelect.options[washTypeSelect.selectedIndex];
        const washType = selectedOption.value;
        const washPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;

        if (!carName) {
            alert('Por favor, insira o nome ou placa do carro.');
            carNameInput.focus();
            return;
        }
        if (!washType || washPrice <= 0) {
            alert('Por favor, selecione um tipo de lavagem válido.');
            washTypeSelect.focus();
            return;
        }

        const washRecord = {
            id: Date.now(),
            car: carName,
            type: washType,
            price: washPrice,
            paymentMethod: null
        };

        recordedWashes.push(washRecord);
        const washIndex = recordedWashes.length - 1;

        addWashToTable(washRecord, washIndex);
        updateLiveTotals();
        clearInputs();

        console.log("Lavagem adicionada:", washRecord);
        console.log("Lista atual:", recordedWashes);
    }

    function addWashToTable(wash, index) {
        const newRow = washListTableBody.insertRow();
        newRow.dataset.washId = wash.id;

        const cellCar = newRow.insertCell();
        const cellType = newRow.insertCell();
        const cellPrice = newRow.insertCell();
        const cellActions = newRow.insertCell();

        cellCar.textContent = wash.car;
        cellType.textContent = wash.type;
        cellPrice.textContent = formatCurrency(wash.price);
        cellPrice.style.textAlign = 'right';

        const paymentSelect = document.createElement('select');
        paymentSelect.classList.add('payment-select');
        paymentSelect.dataset.washIndex = index; 

        paymentSelect.innerHTML = `
            <option value="">-- Pagar com --</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Pix">Pix</option>
            <option value="Cartão - Débito">Cartão - Débito</option>
            <option value="Cartão - Crédito">Cartão - Crédito</option>
        `;

        paymentSelect.addEventListener('change', handlePaymentSelection);

        cellActions.appendChild(paymentSelect);
    }

    function handlePaymentSelection(event) {
        if (isRegisterClosed) {
            alert("O caixa já foi fechado. Não é possível alterar o pagamento.");
            event.target.value = recordedWashes[parseInt(event.target.dataset.washIndex, 10)].paymentMethod || "";
            return;
        }
        const selectElement = event.target;
        const selectedPaymentMethod = selectElement.value;
        const washIndex = parseInt(selectElement.dataset.washIndex, 10);

        if (!selectedPaymentMethod || isNaN(washIndex) || washIndex < 0 || washIndex >= recordedWashes.length) {
             console.error("Invalid wash index or payment method", washIndex, selectedPaymentMethod);
            return;
        }

        recordedWashes[washIndex].paymentMethod = selectedPaymentMethod;
        console.log("Pagamento atualizado:", recordedWashes[washIndex]);

        const cellActions = selectElement.parentNode;
        cellActions.innerHTML = ''; 

        const paymentText = document.createElement('span');
        paymentText.textContent = selectedPaymentMethod;
        paymentText.classList.add('payment-selected-text');
        const methodClass = selectedPaymentMethod.toLowerCase().replace(/[^a-z0-9]+/g, '-'); 
        paymentText.classList.add(methodClass);

        cellActions.appendChild(paymentText);
    }

    function clearInputs() {
        carNameInput.value = '';
        washTypeSelect.selectedIndex = 0;
        carNameInput.focus();
    }

    function formatCurrency(value) {
        return value.toFixed(2).replace('.', ',');
    }

    function updateLiveTotals() {
        totalCars = recordedWashes.length;
        totalRevenue = recordedWashes.reduce((sum, wash) => sum + wash.price, 0);

        totalRevenueSpan.textContent = formatCurrency(totalRevenue);
        totalCarsSpan.textContent = totalCars;
    }

    function closeRegister() {
        if (isRegisterClosed) {
            alert("O caixa já foi fechado.");
            return;
        }
        isRegisterClosed = true;
        closeRegisterButton.disabled = true; 
        closeRegisterButton.innerHTML = '<i class="fas fa-lock-open"></i> Caixa Fechado'; 

        addWashButton.disabled = true;
        document.querySelectorAll('.payment-select').forEach(select => select.disabled = true);
        carNameInput.disabled = true;
        washTypeSelect.disabled = true;

        let totalsByPayment = {
            'Dinheiro': { total: 0, count: 0 },
            'Pix': { total: 0, count: 0 },
            'Cartão - Débito': { total: 0, count: 0 },
            'Cartão - Crédito': { total: 0, count: 0 }
        };
        let pendingPaymentCount = 0;
        let pendingPaymentTotal = 0;
        let paidTotalRevenue = 0;
        let paidCarsCount = 0;

        recordedWashes.forEach(wash => {
            if (wash.paymentMethod && totalsByPayment.hasOwnProperty(wash.paymentMethod)) {
                totalsByPayment[wash.paymentMethod].total += wash.price;
                totalsByPayment[wash.paymentMethod].count++;
                paidTotalRevenue += wash.price;
                paidCarsCount++;
            } else {
                const row = washListTableBody.querySelector(`tr[data-wash-id='${wash.id}']`);
                if(row && row.cells.length > 3 && row.cells[3].querySelector('.payment-select')) {
                    row.cells[3].innerHTML = '<span class="payment-selected-text pending">Pendente</span>';
                }
                pendingPaymentCount++;
                pendingPaymentTotal += wash.price;
            }
        });

        let paymentDetailsHtml = '';
        let hasPaymentDetails = false;
        for (const method in totalsByPayment) {
            if (totalsByPayment[method].count > 0) {
                paymentDetailsHtml += `<p>${method}: <strong>R$ ${formatCurrency(totalsByPayment[method].total)}</strong> (${totalsByPayment[method].count} carro(s))</p>`;
                hasPaymentDetails = true;
            }
        }

        if (pendingPaymentCount > 0) {
             paymentDetailsHtml += `<p style="color: var(--danger-color);">Pagamento Pendente: <strong>R$ ${formatCurrency(pendingPaymentTotal)}</strong> (${pendingPaymentCount} carro(s))</p>`;
            hasPaymentDetails = true;
        }

        if (hasPaymentDetails) {
            paymentDetailsDiv.innerHTML = paymentDetailsHtml;
            paymentSummaryDiv.style.display = 'block';
        } else if (recordedWashes.length > 0) { 
            paymentDetailsDiv.innerHTML = `<p>Nenhuma lavagem foi paga.</p><p style="color: var(--danger-color);">Total Pendente: <strong>R$ ${formatCurrency(pendingPaymentTotal)}</strong> (${pendingPaymentCount} carro(s))</p>`;
            paymentSummaryDiv.style.display = 'block';
        } else {
             paymentDetailsDiv.innerHTML = '<p>Nenhuma lavagem registrada.</p>';
             paymentSummaryDiv.style.display = 'block'; 
        }

        let registerSummaryHtml = '';
        registerSummaryHtml += `<p>Total de Carros Atendidos: <strong>${totalCars}</strong></p>`;
        registerSummaryHtml += `<p>Receita Total (Paga): <strong>R$ ${formatCurrency(paidTotalRevenue)}</strong> (${paidCarsCount} carro(s))</p>`;
        registerSummaryHtml += `<p>Receita Pendente: <strong style="color: var(--danger-color);">R$ ${formatCurrency(pendingPaymentTotal)}</strong> (${pendingPaymentCount} carro(s))</p>`;

        registerSummaryDetailsDiv.innerHTML = registerSummaryHtml;
        registerSummaryDiv.style.display = 'block'; 

        liveSummaryDiv.style.display = 'none';

        console.log("Caixa fechado. Totals by Payment:", totalsByPayment, "Pending:", {total: pendingPaymentTotal, count: pendingPaymentCount});

    }

    updateLiveTotals();
    paymentSummaryDiv.style.display = 'none';
    registerSummaryDiv.style.display = 'none'; 
});