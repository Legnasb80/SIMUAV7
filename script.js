// --- Constantes y Modelo Físico ---
const DENSIDADES = {
    10.5: { FC100: 940.00, FC220: 937.43, FC200: 936.97, FC300: 934.78 },
    10.4: { FC100: 939.83, FC220: 936.52, FC200: 935.46, FC300: 933.93 },
    10.3: { FC100: 939.61, FC220: 936.47, FC200: 935.44, FC300: 933.71 },
    10.2: { FC100: 939.39, FC220: 936.33, FC200: 935.31, FC300: 933.25 },
    10.1: { FC100: 939.25, FC220: 936.30, FC200: 935.30, FC300: 933.17 },
    10.0: { FC100: 939.12, FC220: 936.26, FC200: 935.15, FC300: 933.00 },
    9.9:  { FC100: 938.77, FC220: 936.14, FC200: 934.46, FC300: 932.81 },
    9.8:  { FC100: 938.55, FC220: 935.41, FC200: 934.35, FC300: 932.63 },
    9.7:  { FC100: 938.41, FC220: 935.40, FC200: 934.28, FC300: 932.51 },
    9.6:  { FC100: 938.18, FC220: 935.38, FC200: 934.23, FC300: 932.20 },
    9.5:  { FC100: 938.11, FC220: 935.16, FC200: 934.14, FC300: 932.07 },
    9.4:  { FC100: 937.72, FC220: 934.57, FC200: 933.35, FC300: 931.83 },
    9.3:  { FC100: 937.63, FC220: 934.43, FC200: 933.27, FC300: 931.50 },
    9.2:  { FC100: 937.38, FC220: 934.38, FC200: 933.20, FC300: 931.47 },
    9.1:  { FC100: 937.32, FC220: 934.22, FC200: 933.14, FC300: 931.25 },
    9.0:  { FC100: 937.13, FC220: 934.13, FC200: 933.08, FC300: 931.16 },
    8.9:  { FC100: 936.76, FC220: 933.82, FC200: 932.78, FC300: 930.53 },
    8.8:  { FC100: 936.62, FC220: 933.73, FC200: 932.64, FC300: 930.47 },
    8.7:  { FC100: 936.30, FC220: 933.45, FC200: 932.22, FC300: 930.32 },
    8.6:  { FC100: 936.16, FC220: 933.29, FC200: 932.14, FC300: 930.21 },
    8.5:  { FC100: 936.00, FC220: 933.17, FC200: 931.96, FC300: 930.14 },
    8.4:  { FC100: 935.78, FC220: 932.74, FC200: 931.44, FC300: 929.83 },
    8.3:  { FC100: 935.57, FC220: 932.53, FC200: 931.31, FC300: 929.75 },
    8.2:  { FC100: 935.48, FC220: 932.41, FC200: 931.22, FC300: 929.42 },
    8.1:  { FC100: 935.20, FC220: 932.25, FC200: 931.18, FC300: 929.31 },
    8.0:  { FC100: 935.13, FC220: 932.10, FC200: 931.11, FC300: 929.25 },
    7.9:  { FC100: 934.90, FC220: 931.87, FC200: 930.93, FC300: 928.81 },
    7.8:  { FC100: 934.52, FC220: 931.72, FC200: 930.57, FC300: 928.34 },
    7.7:  { FC100: 934.32, FC220: 931.60, FC200: 930.62, FC300: 928.27 },
    7.6:  { FC100: 934.20, FC220: 931.53, FC200: 930.40, FC300: 928.18 },
    7.5:  { FC100: 934.14, FC220: 931.38, FC200: 930.25, FC300: 928.07 }
};

const CONSTANTS = {
    DENS_H2: 0.08928,
    CONST_APROV: 0.14,
    DENS_O2: 1.4285,
    PORC_CRUDO: (100 - 35) / 35,
    CONC_PEROX: 0.4,
    VOL_MOLAR: 22.4,
    PM_H2O2: 34,
    REL_DILUCION: 2.5,
    CONC_RECIR: 800
};

// --- Utilidades ---
function fmt(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return "---";
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

// --- Lógica de Cálculo ---
function calcular(prod_diaria_t, grados_hidrogenacion) {
    const grados = Math.round(grados_hidrogenacion * 10) / 10;
    
    if (!DENSIDADES[grados]) {
        return { error: "Grados fuera de tabla (7.5 - 10.5)." };
    }

    if (prod_diaria_t < (55.44 * 0.51)) {
        return { error: "PRODUCCIÓN POR DEBAJO DEL MÍNIMO (51% de 55.44)", reset: true };
    }

    const dens = DENSIDADES[grados];
    const ST_FC300 = (prod_diaria_t * 1000) / (24 * grados);

    if (ST_FC300 > 220) {
        return { error: "CONDICIÓN NO OPERABLE: FC300 SUPERA 220 m³/h", reset: true };
    }

    // Cálculos de Masa y Flujo
    const mH2O2 = (prod_diaria_t * 1000) / 24;
    const mFC300 = ST_FC300 * dens.FC300;
    const mFC100 = mFC300 - mH2O2;
    const FC100_m3h = mFC100 / dens.FC100;

    const H2_Nm3h = (prod_diaria_t * 1000 * CONSTANTS.VOL_MOLAR) / (24 * CONSTANTS.PM_H2O2);
    const mFC102 = H2_Nm3h * CONSTANTS.DENS_H2;
    const FC220_m3h = (mFC100 + mFC102) / dens.FC220;
    const mFC220 = FC220_m3h * dens.FC220;

    const F_AIRE1 = H2_Nm3h * 0.4 / CONSTANTS.CONST_APROV;
    const F_AIRE2 = H2_Nm3h * 0.6 / CONSTANTS.CONST_APROV;
    const mAIRE1 = F_AIRE1 * CONSTANTS.CONST_APROV * CONSTANTS.DENS_O2;

    const mFC200_h = mFC220 + mAIRE1;
    const FC200_m3h = mFC200_h / dens.FC200;

    // Enfriamiento Stage 1
    const QFC_220 = mFC220 * 2.093 * 7;
    const mFC_117 = QFC_220 / (4.18 * (37 - 27));
    const FC_117 = mFC_117 / 998.3;

    const QFC_220A = mFC220 * 2.093 * 4;
    const mFC_208 = QFC_220A / (4.18 * (37 - 27));
    const FC_208 = mFC_208 / 998.3;

    const QFC_200 = mFC220 * 1.872 * 2;
    const mFC_211 = QFC_200 / (4.18 * (37 - 27));
    const FC_211 = mFC_211 / 998.3;

    // Enfriamiento Stage 2
    const QFC_300_heat = mFC300 * 1.872 * 3;
    const mFC_213 = QFC_300_heat / (4.18 * (36 - 27));
    const FC_213 = mFC_213 / 998.3;

    // Otros
    const agua_extractor = ((prod_diaria_t * 1000 * CONSTANTS.PORC_CRUDO / 24) + (CONSTANTS.REL_DILUCION * ST_FC300)) / 1000;
    const perox_crudo = (H2_Nm3h * CONSTANTS.PM_H2O2) / (CONSTANTS.VOL_MOLAR * CONSTANTS.CONC_PEROX);
    const aire_total = H2_Nm3h / (0.21 - 0.07);

    // Recirculación
    const FC_110 = CONSTANTS.CONC_RECIR + FC100_m3h;
    const mFC_110 = FC_110 * dens.FC220;
    const QFC_110 = mFC_110 * 2.093 * 4;
    const mFC_116 = QFC_110 / (4.18 * (39 - 27));
    const FC_116 = mFC_116 / 998.3;

    return {
        ST_FC300, FC100: FC100_m3h, H2: H2_Nm3h, FC220: FC220_m3h, 
        AIRE1: F_AIRE1, FC200: FC200_m3h, AIRE2: F_AIRE2,
        agua_extractor, perox_crudo, aire_total,
        FC_110, FC_116, FC_117, FC_208, FC_211, FC_213
    };
}

// --- Manejo de UI ---
document.getElementById('btn-calcular').addEventListener('click', () => {
    const prod = parseFloat(document.getElementById('prod_diaria').value);
    const grados = parseFloat(document.getElementById('grados').value);
    const statusDiv = document.getElementById('status-message');
    
    statusDiv.textContent = "";

    if (isNaN(prod) || isNaN(grados)) {
        statusDiv.textContent = "Ingrese valores válidos.";
        return;
    }

    const results = calcular(prod, grados);

    if (results.error) {
        statusDiv.textContent = results.error;
        if (results.reset) {
            updateUI(null);
        }
        return;
    }

    updateUI(results);
});

function updateUI(res) {
    const fields = [
        "ST_FC300", "FC100", "H2", "FC220", "AIRE1", "FC200", "AIRE2",
        "agua_extractor", "perox_crudo", "aire_total",
        "FC_110", "FC_116", "FC_117", "FC_208", "FC_211", "FC_213"
    ];

    fields.forEach(f => {
        const el = document.getElementById(`val-${f}`);
        if (el) {
            if (res === null) {
                el.textContent = "0,0";
            } else {
                // Formatting specific to unit
                let decimals = 1;
                if (f === "perox_crudo") decimals = 0;
                el.textContent = fmt(res[f], decimals);
            }
        }
    });

    // Scrollear un poco hacia abajo para mostrar resultados
    if (res !== null) {
        document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
    }
}
