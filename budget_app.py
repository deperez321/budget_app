import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Configuración de la página
st.set_page_config(page_title="Calculadora de Gastos Mensuales", layout="centered", initial_sidebar_state="collapsed")

# --- CSS Personalizado ---
def local_css():
    st.markdown(
        """
        <style>
        /* --- General --- */
        .stApp {
            background-color: #0c0030; /* Fondo principal oscuro */
            color: #e0e0e0; /* Color de texto principal claro */
            font-family: 'Roboto', 'Segoe UI', sans-serif;
        }

        /* --- Títulos y Subtítulos --- */
        h1 { /* st.title */
            color: #61dafb; /* Azul claro brillante para el título principal */
            text-align: center;
            margin-bottom: 30px;
            font-weight: bold;
        }

        h3 { /* st.subheader */
            color: #bbe1fa; /* Azul más suave para subtítulos */
            border-bottom: 2px solid #3282b8;
            padding-bottom: 8px;
            margin-top: 25px;
            margin-bottom: 15px;
        }

        /* --- Widgets de Input (NumberInput) --- */
        .stNumberInput label {
            color: #a0b4c8 !important; /* Color de la etiqueta del input */
            font-weight: 500;
        }
        .stNumberInput > div > div > input {
            background-color: #1f2937; /* Fondo del campo de input */
            color: #e0e0e0; /* Color del texto dentro del input */
            border: 1px solid #3282b8;
            border-radius: 5px;
            padding: 8px 10px;
        }
        .stNumberInput > div > div > input:focus {
            border-color: #61dafb;
            box-shadow: 0 0 0 0.2rem rgba(97, 218, 251, 0.25);
        }

        /* --- Métricas (st.metric) --- */
        .stMetric {
            background-color: #1a1a2e; /* Fondo ligeramente diferente para la métrica */
            border-left: 5px solid #61dafb;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .stMetric > label { /* Etiqueta de la métrica */
            color: #a0b4c8;
        }
        .stMetric > div > div { /* Valor de la métrica */
            color: #ffffff;
            font-size: 1.5em;
        }
        .stMetric > div > p { /* Delta de la métrica */
            color: #888ea8;
        }

        /* --- Data Editor --- */
        .stDataFrame, .stDataEditor {
            border: 1px solid #3282b8;
            border-radius: 8px;
            overflow: hidden; /* Para que el borde redondeado afecte al contenido */
        }
        /* Para el header del data editor */
        .stDataFrame .col_heading, .stDataEditor .col_heading {
            background-color: #1f2937 !important;
            color: #bbe1fa !important;
        }

        /* --- Mensajes de Éxito y Error --- */
        .stAlert.st-success p { /* Texto dentro de st.success */
            color: #155724 !important; /* Verde oscuro para mejor contraste en fondo verde claro */
        }
        .stAlert.st-error p { /* Texto dentro de st.error */
            color: #721c24 !important; /* Rojo oscuro para mejor contraste en fondo rojo claro */
        }
        
        /* --- Botones (Estilo base si se añaden otros botones) --- */
        .stButton > button {
            background-color: #3282b8;
            color: white;
            border-radius: 5px;
            padding: 8px 15px;
            border: none;
            transition: background-color 0.3s ease;
        }
        .stButton > button:hover {
            background-color: #61dafb;
            color: #0c0030;
        }
        .stButton > button:active {
            background-color: #2a6fa1;
        }

        /* --- Expander --- */
        .stExpander > summary {
            font-size: 1.1em;
            font-weight: bold;
            color: #bbe1fa;
        }
        .stExpander > summary:hover {
            color: #61dafb;
        }
        .stExpander div[data-testid="stExpanderDetails"] {
            background-color: #1a1a2e; /* Fondo ligeramente diferente para el contenido del expander */
            border-radius: 0 0 8px 8px;
            padding: 15px;
            margin-top: -8px; /* Ajuste para que se vea continuo con el header */
        }

        </style>
        """,
        unsafe_allow_html=True,
    )

# Aplicar CSS
local_css()

st.title("📊 Calculadora de Gastos Mensuales")

# Constantes
PRECIO_HORA_EXTRA = 6.50
HORAS_JORNADA_COMPLETA = 160

# --- Funciones de utilidad ---
def calcular_gasto_porcentaje(concepto, porcentaje, salario_neto):
    return {"Concepto": concepto, "Importe": round(salario_neto * porcentaje, 2)}

def get_default_expenses(salario_neto):
    """Genera la lista de gastos por defecto."""
    return [
        {"Concepto": "Alquiler", "Importe": 330.0},
        calcular_gasto_porcentaje("Diezmo (1%)", 0.01, salario_neto),
        {"Concepto": "Transporte", "Importe": 21.8},
        {"Concepto": "Telefonía", "Importe": 16.0},
        {"Concepto": "Corte de cabello", "Importe": 12.0},
        calcular_gasto_porcentaje("Ahorro (24%)", 0.24, salario_neto),
        calcular_gasto_porcentaje("Mercado Nicaragua (1%)", 0.01, salario_neto),
        calcular_gasto_porcentaje("Comida y personales (7%)", 0.07, salario_neto),
        calcular_gasto_porcentaje("Salidas y aniversario (13%)", 0.13, salario_neto),
        calcular_gasto_porcentaje("Mamá & Camila (10%)", 0.10, salario_neto),
        {"Concepto": "Ofrenda", "Importe": 5.0},
        calcular_gasto_porcentaje("Carnet de conducir (1%)", 0.01, salario_neto),
        calcular_gasto_porcentaje("Misión Sarah (1%)", 0.01, salario_neto),
    ]

# --- Inicialización del estado de sesión ---
if 'salario_base' not in st.session_state:
    st.session_state.salario_base = 1381.33
if 'horas_extra' not in st.session_state:
    st.session_state.horas_extra = 0
if 'irpf' not in st.session_state:
    st.session_state.irpf = 0.02
if 'expenses' not in st.session_state:
    temp_salario_bruto = st.session_state.salario_base + (st.session_state.horas_extra * PRECIO_HORA_EXTRA)
    temp_salario_neto = temp_salario_bruto * (1 - st.session_state.irpf)
    st.session_state.expenses = get_default_expenses(temp_salario_neto)
if 'last_salary_neto_for_expenses' not in st.session_state:
    st.session_state.last_salary_neto_for_expenses = 0


# --- 1) Datos de salario e IRPF editables (dentro de un expander) ---
with st.expander("💰 Configuración de Salario e IRPF", expanded=True):
    salario_base_input = st.number_input(
        "Salario Base (160 horas) (€):",
        min_value=0.0,
        value=st.session_state.salario_base,
        step=10.0,
        format="%.2f",
        help=f"Salario base correspondiente a jornada completa de {HORAS_JORNADA_COMPLETA} horas mensuales"
    )
    if salario_base_input != st.session_state.salario_base:
        st.session_state.salario_base = salario_base_input
        st.rerun()

    col_he1, col_he2 = st.columns(2)
    with col_he1:
        horas_extra_input = st.number_input(
            "Horas Extra:",
            min_value=0,
            max_value=100,
            value=st.session_state.horas_extra,
            step=1
        )
        if horas_extra_input != st.session_state.horas_extra:
            st.session_state.horas_extra = horas_extra_input
            st.rerun()

    with col_he2:
        importe_horas_extra = st.session_state.horas_extra * PRECIO_HORA_EXTRA
        st.metric(
            "Importe Horas Extra",
            f"{importe_horas_extra:.2f} €",
            delta=f"{st.session_state.horas_extra} h × {PRECIO_HORA_EXTRA:.2f} €/h",
            delta_color="off"
        )

    irpf_input_percentage = st.number_input(
        "IRPF (%):",
        min_value=0.0,
        max_value=100.0,
        value=st.session_state.irpf * 100,
        step=0.1,
        format="%.1f"
    )
    new_irpf = irpf_input_percentage / 100
    if new_irpf != st.session_state.irpf:
        st.session_state.irpf = new_irpf
        st.rerun()

# Calcular salario bruto y neto
salario_bruto = st.session_state.salario_base + importe_horas_extra
salario_neto = salario_bruto * (1 - st.session_state.irpf)

# Actualizar gastos basados en porcentaje si el salario neto ha cambiado significativamente
if abs(st.session_state.get('last_salary_neto_for_expenses', 0) - salario_neto) > 0.01:
    current_expenses_df = pd.DataFrame(st.session_state.expenses)
    new_expenses_list = []
    default_expenses_for_concepts = {item['Concepto']: item for item in get_default_expenses(salario_neto)}

    for index, row in current_expenses_df.iterrows():
        concepto = row['Concepto']
        if concepto in default_expenses_for_concepts and "(%)" in concepto:
            new_expenses_list.append(default_expenses_for_concepts[concepto])
        else:
            new_expenses_list.append({"Concepto": concepto, "Importe": row['Importe']})
    
    st.session_state.expenses = new_expenses_list
    st.session_state.last_salary_neto_for_expenses = salario_neto


# --- 2) Lista de Gastos Editable ---
st.subheader("📝 Lista de Gastos")

df_expenses = pd.DataFrame(st.session_state.expenses)
edited_df = st.data_editor(
    df_expenses,
    num_rows="dynamic",
    use_container_width=True,
    column_config={
        "Importe": st.column_config.NumberColumn(
            "Importe (€)",
            format="%.2f",
            step=1.0,
        )
    }
)
if not df_expenses.equals(edited_df):
    st.session_state.expenses = edited_df.to_dict(orient="records")

# Calcular totales
df_final_expenses = pd.DataFrame(st.session_state.expenses)
total_gastos = df_final_expenses['Importe'].sum() if not df_final_expenses.empty else 0.0
saldo_restante = round(salario_neto - total_gastos, 2)

# --- 3) Mostrar resumen de salario y gastos ---
st.subheader("🧾 Resumen Financiero")

col_summary1, col_summary2 = st.columns(2)

with col_summary1:
    st.markdown("#### Detalle Salarial")
    st.write(f"Salario base (160h): **€{st.session_state.salario_base:.2f}**")
    if st.session_state.horas_extra > 0:
        st.write(f"Horas extra ({st.session_state.horas_extra}h): **€{importe_horas_extra:.2f}**")
    st.write(f"Salario bruto total: **€{salario_bruto:.2f}**")
    st.write(f"Retención IRPF ({st.session_state.irpf*100:.1f}%): **€{round(salario_bruto * st.session_state.irpf, 2):.2f}**")
    st.markdown(f"#### Salario Neto Disponible: <span style='color: #61dafb; font-weight: bold; font-size: 1.1em;'>€{round(salario_neto, 2):.2f}</span>", unsafe_allow_html=True)


with col_summary2:
    st.markdown("#### Balance de Gastos")
    st.write(f"**Total Gastos:** €{total_gastos:.2f}")

    if saldo_restante >= 0:
        st.success(f"**Saldo Restante:** €{saldo_restante:.2f}")
    else:
        st.error(f"**Déficit:** €{abs(saldo_restante):.2f}")

    porcentaje_gastado = (total_gastos / salario_neto) * 100 if salario_neto > 0 else 0
    st.write(f"**Porcentaje gastado del neto:** {porcentaje_gastado:.1f}%")


# --- 4) Gráfico de pastel mejorado (Restaurado a la versión anterior) ---
st.subheader("🍰 Distribución de Gastos")

if not df_final_expenses.empty and df_final_expenses['Importe'].sum() > 0:
    fig, ax = plt.subplots(figsize=(10, 7), facecolor='#0c0030') # Fondo del gráfico igual al de la app
    ax.set_facecolor('#0c0030') # Fondo del área del gráfico

    df_sorted = df_final_expenses[df_final_expenses['Importe'] > 0].sort_values(by='Importe', ascending=False)
    
    total_grafico = df_sorted['Importe'].sum()
    df_sorted['Porcentaje'] = (df_sorted['Importe'] / total_grafico * 100) if total_grafico > 0 else 0
    
    MIN_PERCENTAGE_FOR_SLICE = 2.5
    small_slices = df_sorted[df_sorted['Porcentaje'] < MIN_PERCENTAGE_FOR_SLICE]
    
    if len(small_slices) > 1 and len(df_sorted) > 5:
        sum_small_slices = small_slices['Importe'].sum()
        df_plot = df_sorted[df_sorted['Porcentaje'] >= MIN_PERCENTAGE_FOR_SLICE].copy()
        otros_row = pd.DataFrame([{'Concepto': f'Otros ({len(small_slices)} conceptos)', 'Importe': sum_small_slices}])
        df_plot = pd.concat([df_plot, otros_row], ignore_index=True)
        df_plot['Porcentaje'] = (df_plot['Importe'] / total_grafico * 100) if total_grafico > 0 else 0
    else:
        df_plot = df_sorted.copy()

    colors = plt.cm.coolwarm(np.linspace(0.1, 0.9, len(df_plot)))

    wedges, texts, autotexts = ax.pie(
        df_plot['Importe'],
        autopct=lambda p: f'{p:.1f}%' if p >= MIN_PERCENTAGE_FOR_SLICE else '',
        wedgeprops={'edgecolor': '#e0e0e0', 'linewidth': 1.2},
        startangle=140,
        colors=colors,
        pctdistance=0.80
    )

    # Estilo de los textos de porcentaje dentro del gráfico
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(9) # Restaurado a 9
        autotext.set_fontweight('bold')

    # Leyenda
    legend_labels = [f"{row['Concepto']} (€{row['Importe']:.2f})"
                     for _, row in df_plot.iterrows()]
    
    leg = ax.legend(
        wedges,
        legend_labels,
        title="Conceptos de Gasto",
        title_fontsize='12', # Restaurado a 12
        loc="center left",
        bbox_to_anchor=(1.05, 0, 0.5, 1), # Restaurado
        fontsize=9, # Restaurado a 9
        labelcolor='#e0e0e0',
        frameon=False
    )
    plt.setp(leg.get_title(), color='#bbe1fa')

    plt.axis('equal')
    # Eliminado plt.tight_layout() si no era parte de la versión original que querías restaurar
    # Si la versión original tenía plt.subplots_adjust, esa sería la línea a restaurar aquí.
    # Por defecto, si no había ajustes explícitos, no se necesita nada más aquí.
    st.pyplot(fig)
else:
    st.info("No hay datos de gastos para mostrar en el gráfico o todos los importes son cero.")

st.markdown("---")
# Pie de página eliminado