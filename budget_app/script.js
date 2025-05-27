document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES ---
    const PRECIO_HORA_EXTRA = 6.50;
    const HORAS_JORNADA_COMPLETA = 160; // No se usa directamente en cálculos pero es bueno tenerla

    // --- ESTADO INICIAL DE GASTOS ---
    let expenses = []; // Se llenará dinámicamente

    // --- ELEMENTOS DEL DOM ---
    const salarioBaseInput = document.getElementById('salarioBase');
    const horasExtraInput = document.getElementById('horasExtra');
    const irpfInput = document.getElementById('irpf');

    const importeHorasExtraValueEl = document.getElementById('importeHorasExtraValue');
    const importeHorasExtraDeltaEl = document.getElementById('importeHorasExtraDelta');

    const expensesTableBody = document.querySelector('#expensesTable tbody');
    const addExpenseRowBtn = document.getElementById('addExpenseRowBtn');

    const summarySalarioBaseEl = document.getElementById('summarySalarioBase');
    const summaryHorasExtraRowEl = document.getElementById('summaryHorasExtraRow');
    const summaryHorasExtraCountEl = document.getElementById('summaryHorasExtraCount');
    const summaryImporteHorasExtraEl = document.getElementById('summaryImporteHorasExtra');
    const summarySalarioBrutoEl = document.getElementById('summarySalarioBruto');
    const summaryIrpfPercentageEl = document.getElementById('summaryIrpfPercentage');
    const summaryIrpfAmountEl = document.getElementById('summaryIrpfAmount');
    const summarySalarioNetoEl = document.getElementById('summarySalarioNeto');

    const summaryTotalGastosEl = document.getElementById('summaryTotalGastos');
    const summarySaldoContainerEl = document.getElementById('summarySaldoContainer');
    const summaryPorcentajeGastadoEl = document.getElementById('summaryPorcentajeGastado');

    const chartCanvas = document.getElementById('expensesPieChart');
    let expensesPieChart; // Variable para la instancia del gráfico

    // --- FUNCIONES DE CÁLCULO ---
    function calcularGastoPorcentaje(concepto, porcentaje, salarioNeto) {
        return { Concepto: concepto, Importe: parseFloat((salarioNeto * porcentaje).toFixed(2)), esPorcentaje: true, porcentajeValor: porcentaje };
    }

    function getDefaultExpenses(salarioNeto) {
        return [
            { Concepto: "Alquiler", Importe: 330.0, esPorcentaje: false },
            calcularGastoPorcentaje("Diezmo (1%)", 0.01, salarioNeto),
            { Concepto: "Transporte", Importe: 21.8, esPorcentaje: false },
            { Concepto: "Telefonía", Importe: 16.0, esPorcentaje: false },
            { Concepto: "Corte de cabello", Importe: 12.0, esPorcentaje: false },
            calcularGastoPorcentaje("Ahorro (24%)", 0.24, salarioNeto),
            calcularGastoPorcentaje("Mercado Nicaragua (1%)", 0.01, salarioNeto),
            calcularGastoPorcentaje("Comida y personales (7%)", 0.07, salarioNeto),
            calcularGastoPorcentaje("Salidas y aniversario (13%)", 0.13, salarioNeto),
            calcularGastoPorcentaje("Mamá & Camila (10%)", 0.10, salarioNeto),
            { Concepto: "Ofrenda", Importe: 5.0, esPorcentaje: false },
            calcularGastoPorcentaje("Carnet de conducir (1%)", 0.01, salarioNeto),
            calcularGastoPorcentaje("Misión Sarah (1%)", 0.01, salarioNeto),
        ];
    }
    
    let lastSalarioNetoForExpenses = 0;

    function updateAllCalculationsAndUI() {
        const salarioBase = parseFloat(salarioBaseInput.value) || 0;
        const horasExtra = parseInt(horasExtraInput.value) || 0;
        const irpfPercentage = parseFloat(irpfInput.value) || 0;
        const irpfDecimal = irpfPercentage / 100;

        // 1. Calcular detalles del salario
        const importeHorasExtra = horasExtra * PRECIO_HORA_EXTRA;
        const salarioBruto = salarioBase + importeHorasExtra;
        const irpfAmount = salarioBruto * irpfDecimal;
        const salarioNeto = salarioBruto - irpfAmount;

        // Actualizar métrica de horas extra
        importeHorasExtraValueEl.textContent = `${importeHorasExtra.toFixed(2)} €`;
        importeHorasExtraDeltaEl.textContent = `${horasExtra} h × ${PRECIO_HORA_EXTRA.toFixed(2)} €/h`;

        // 2. Actualizar gastos basados en porcentaje si el salario neto ha cambiado
        if (Math.abs(lastSalarioNetoForExpenses - salarioNeto) > 0.01) {
            expenses.forEach(expense => {
                if (expense.esPorcentaje) {
                    expense.Importe = parseFloat((salarioNeto * expense.porcentajeValor).toFixed(2));
                }
            });
            lastSalarioNetoForExpenses = salarioNeto;
            renderExpensesTable(); // Re-renderizar tabla si los gastos porcentuales cambiaron
        }


        // 3. Calcular totales de gastos
        const totalGastos = expenses.reduce((sum, exp) => sum + (parseFloat(exp.Importe) || 0), 0);
        const saldoRestante = salarioNeto - totalGastos;
        const porcentajeGastado = salarioNeto > 0 ? (totalGastos / salarioNeto) * 100 : 0;

        // 4. Actualizar UI del resumen
        summarySalarioBaseEl.textContent = `€${salarioBase.toFixed(2)}`;
        if (horasExtra > 0) {
            summaryHorasExtraRowEl.style.display = 'block';
            summaryHorasExtraCountEl.textContent = horasExtra;
            summaryImporteHorasExtraEl.textContent = `€${importeHorasExtra.toFixed(2)}`;
        } else {
            summaryHorasExtraRowEl.style.display = 'none';
        }
        summarySalarioBrutoEl.textContent = `€${salarioBruto.toFixed(2)}`;
        summaryIrpfPercentageEl.textContent = irpfPercentage.toFixed(1);
        summaryIrpfAmountEl.textContent = `€${irpfAmount.toFixed(2)}`;
        summarySalarioNetoEl.textContent = `€${salarioNeto.toFixed(2)}`;

        summaryTotalGastosEl.textContent = `€${totalGastos.toFixed(2)}`;
        if (saldoRestante >= 0) {
            summarySaldoContainerEl.innerHTML = `<p class="success-message"><strong>Saldo Restante:</strong> <span id="summarySaldoRestante">€${saldoRestante.toFixed(2)}</span></p>`;
        } else {
            summarySaldoContainerEl.innerHTML = `<p class="error-message"><strong>Déficit:</strong> <span id="summarySaldoRestante">€${Math.abs(saldoRestante).toFixed(2)}</span></p>`;
        }
        summaryPorcentajeGastadoEl.textContent = porcentajeGastado.toFixed(1);

        // 5. Actualizar gráfico
        renderPieChart();
    }

    // --- RENDERIZADO DE LA TABLA DE GASTOS ---
    function renderExpensesTable() {
        expensesTableBody.innerHTML = ''; // Limpiar tabla
        expenses.forEach((expense, index) => {
            const row = expensesTableBody.insertRow();
            row.dataset.index = index;

            const cellConcepto = row.insertCell();
            const inputConcepto = document.createElement('input');
            inputConcepto.type = 'text';
            inputConcepto.value = expense.Concepto;
            inputConcepto.addEventListener('change', (e) => {
                expenses[index].Concepto = e.target.value;
                // Si se cambia un concepto que era de porcentaje, ya no lo es
                if (expenses[index].esPorcentaje) {
                    expenses[index].esPorcentaje = false; 
                    delete expenses[index].porcentajeValor;
                }
                updateAllCalculationsAndUI();
            });
            cellConcepto.appendChild(inputConcepto);

            const cellImporte = row.insertCell();
            const inputImporte = document.createElement('input');
            inputImporte.type = 'number';
            inputImporte.value = parseFloat(expense.Importe).toFixed(2);
            inputImporte.step = "0.01";
            inputImporte.addEventListener('change', (e) => {
                expenses[index].Importe = parseFloat(e.target.value) || 0;
                 // Si se cambia un importe que era de porcentaje, ya no lo es
                if (expenses[index].esPorcentaje) {
                    expenses[index].esPorcentaje = false;
                    delete expenses[index].porcentajeValor;
                }
                updateAllCalculationsAndUI();
            });
            cellImporte.appendChild(inputImporte);

            const cellAcciones = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                expenses.splice(index, 1);
                renderExpensesTable(); // Re-renderizar después de eliminar
                updateAllCalculationsAndUI();
            });
            cellAcciones.appendChild(deleteBtn);
        });
    }

    // --- RENDERIZADO DEL GRÁFICO ---
    function renderPieChart() {
        const validExpenses = expenses.filter(exp => exp.Importe > 0);
        if (validExpenses.length === 0) {
            if (expensesPieChart) expensesPieChart.destroy(); // Destruir gráfico anterior si existe
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#a0b4c8';
            ctx.font = "16px 'Roboto', sans-serif";
            ctx.fillText("No hay gastos para mostrar.", chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }

        let dfSorted = [...validExpenses].sort((a, b) => b.Importe - a.Importe);
        const totalGrafico = dfSorted.reduce((sum, exp) => sum + exp.Importe, 0);

        dfSorted.forEach(exp => {
            exp.Porcentaje = totalGrafico > 0 ? (exp.Importe / totalGrafico) * 100 : 0;
        });

        const MIN_PERCENTAGE_FOR_SLICE = 2.5;
        let dfPlot = dfSorted;
        const smallSlices = dfSorted.filter(exp => exp.Porcentaje < MIN_PERCENTAGE_FOR_SLICE);

        if (smallSlices.length > 1 && dfSorted.length > 5) {
            const sumSmallSlices = smallSlices.reduce((sum, exp) => sum + exp.Importe, 0);
            dfPlot = dfSorted.filter(exp => exp.Porcentaje >= MIN_PERCENTAGE_FOR_SLICE);
            if (sumSmallSlices > 0) {
                 dfPlot.push({ Concepto: `Otros (${smallSlices.length} conceptos)`, Importe: sumSmallSlices, Porcentaje: (sumSmallSlices / totalGrafico) * 100 });
            }
        }
        
        const labels = dfPlot.map(exp => exp.Concepto);
        const data = dfPlot.map(exp => exp.Importe);
        
        const baseColors = [ 
            '#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40',
            '#2ECC71', '#E74C3C', '#3498DB', '#F1C40F', '#8E44AD', '#1ABC9C',
            '#61dafb', '#bbe1fa', '#3282b8', '#1f2937', '#1a1a2e' // Colores adicionales del tema
        ];
        const chartColors = dfPlot.map((_, i) => baseColors[i % baseColors.length]);


        if (expensesPieChart) {
            expensesPieChart.destroy(); 
        }

        expensesPieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Distribución de Gastos',
                    data: data,
                    backgroundColor: chartColors,
                    borderColor: '#e0e0e0', 
                    borderWidth: 1.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, 
                plugins: {
                    legend: {
                        position: 'right', 
                        labels: {
                            color: '#e0e0e0', 
                            font: {
                                size: 9 
                            },
                            padding: 15,
                             boxWidth: 10,
                        },
                        title: {
                            display: true,
                            text: 'Conceptos de Gasto',
                            color: '#bbe1fa',
                            font: {
                                size: 12, 
                                weight: 'bold'
                            },
                            padding: { top: 5, bottom: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed);
                                    const percentage = ((context.parsed / totalGrafico) * 100).toFixed(1);
                                    label += ` (${percentage}%)`;
                                }
                                return label;
                            }
                        },
                        bodyFont: { size: 11 },
                        titleFont: { size: 12 },
                        backgroundColor: 'rgba(26, 26, 46, 0.9)', // #1a1a2e con opacidad
                        borderColor: '#61dafb',
                        borderWidth: 1,
                        padding: 10,
                        caretPadding: 10,
                        cornerRadius: 6
                    },
                    // Para mostrar porcentajes directamente en el gráfico, se necesitaría el plugin chartjs-plugin-datalabels
                    // Ejemplo de cómo se configuraría (requiere <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>):
                    /*
                    datalabels: {
                        formatter: (value, ctx) => {
                            const dataset = ctx.chart.data.datasets[0];
                            const total = dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = ((value / total) * 100).toFixed(1) + "%";
                            // Solo mostrar si el porcentaje es mayor a MIN_PERCENTAGE_FOR_SLICE
                            const originalDataPoint = dfPlot[ctx.dataIndex];
                            if (originalDataPoint && originalDataPoint.Porcentaje >= MIN_PERCENTAGE_FOR_SLICE) {
                                return percentage;
                            }
                            return '';
                        },
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 9
                        },
                        anchor: 'end',
                        align: 'start',
                        offset: -10, // Ajustar para que no se solape con el borde
                        borderRadius: 4,
                        backgroundColor: (context) => context.dataset.backgroundColor, // Fondo igual al de la porción
                        padding: 4
                    }
                    */
                },
                layout: {
                    padding: {
                        left: 5,
                        right: 5, // Dejar espacio para la leyenda si está a la derecha
                        top: 5,
                        bottom: 5
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
            // Si usas chartjs-plugin-datalabels, regístralo:
            // plugins: [ChartDataLabels]
        });
    }


    // --- EVENT LISTENERS ---
    [salarioBaseInput, horasExtraInput, irpfInput].forEach(input => {
        input.addEventListener('input', updateAllCalculationsAndUI);
    });

    addExpenseRowBtn.addEventListener('click', () => {
        expenses.push({ Concepto: "Nuevo Gasto", Importe: 0, esPorcentaje: false });
        renderExpensesTable();
        updateAllCalculationsAndUI(); 
    });

    // --- INICIALIZACIÓN ---
    function initializeApp() {
        const initialSalarioBase = parseFloat(salarioBaseInput.value) || 0;
        const initialHorasExtra = parseInt(horasExtraInput.value) || 0;
        const initialIrpfDecimal = (parseFloat(irpfInput.value) || 0) / 100;
        
        const initialImporteHorasExtra = initialHorasExtra * PRECIO_HORA_EXTRA;
        const initialSalarioBruto = initialSalarioBase + initialImporteHorasExtra;
        const initialSalarioNeto = initialSalarioBruto * (1 - initialIrpfDecimal);

        expenses = getDefaultExpenses(initialSalarioNeto);
        lastSalarioNetoForExpenses = initialSalarioNeto;
        renderExpensesTable();
        updateAllCalculationsAndUI();
    }

    initializeApp();
});