const ConfiguracionAlarma = require("../routers/prueba.router/models/configuracion_alarmas");
const Alarma = require("../routers/prueba.router/models/alarmas");
const Log = require("../routers/prueba.router/models/logs");
const Users = require("../routers/prueba.router/models/users");
const { sendAlarmMail } = require("./mail.services");
const config = require("../config");

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const CHECK_INTERVAL_HOURS = config.ALARM.CHECK_INTERVAL_HOURS;
const CHECK_INTERVAL_MS = CHECK_INTERVAL_HOURS * MS_PER_HOUR;

const normalizeTipo = (tipo) => String(tipo || "").trim().toUpperCase();

const nextIntervalDelay = () => {
  const now = new Date();
  const elapsed = now.getTime() % CHECK_INTERVAL_MS;
  return elapsed === 0 ? CHECK_INTERVAL_MS : CHECK_INTERVAL_MS - elapsed;
};

const getNextAlarmId = async () => {
  const maxAlarm = await Alarma.findOne().sort({ alarmaId: -1 }).limit(1);
  return (maxAlarm?.alarmaId || 0) + 1;
};

const startOfDay = (date) => {
  const dt = new Date(date);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/**
 * 📊 Consumo energético
 */
const calculateConsumption = async (nodoId, fechaInicio, fechaFin) => {
  const listado = await Log.find({
    nodoId: Number(nodoId),
    ts: {
      $gte: fechaInicio,
      $lte: fechaFin,
    },
  }).sort({ ts: 1 });

  if (!listado.length) {
    return {
      energia_activa_kWh: 0,
      vrms_promedio: 0,
      muestras: 0,
    };
  }

  let energiaActivaWh = 0;
  let sumaVrms = 0;

  for (let i = 0; i < listado.length - 1; i++) {
    const actual = listado[i];
    const siguiente = listado[i + 1];
    const deltaSegundos = (new Date(siguiente.ts) - new Date(actual.ts)) / 1000;

    energiaActivaWh += (actual.potencia_activa * deltaSegundos) / 3600;
    sumaVrms += actual.vrms;
  }

  if (listado.length === 1) {
    sumaVrms = listado[0].vrms;
  }

  return {
    energia_activa_kWh: Number((energiaActivaWh / 1000).toFixed(3)),
    vrms_promedio: Number((sumaVrms / listado.length).toFixed(2)),
    muestras: listado.length,
  };
};

/**
 * 📅 Rangos por período
 */
const getRangeForPeriod = (periodo) => {
  const now = new Date();
  const p = String(periodo || "").trim().toUpperCase();

  switch (p) {
    case "DIARIO": {
      const inicio = startOfDay(now);
      return { inicio, fin: now };
    }

    case "SEMANAL": {
      const inicio = new Date(now);
      const day = inicio.getDay(); // 0 domingo

      const diffToMonday = (day === 0 ? -6 : 1) - day;
      inicio.setDate(inicio.getDate() + diffToMonday);
      inicio.setHours(0, 0, 0, 0);

      return { inicio, fin: now };
    }

    case "MENSUAL":
    default: {
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
      return { inicio, fin: now };
    }
  }
};

/**
 * 🚫 Evitar duplicados por período
 */
const shouldCreateAlarm = async (config, tipo, periodo) => {
  const { inicio } = getRangeForPeriod(periodo);

  const existing = await Alarma.findOne({
    dispositivoId: config.dispositivoId,
    tipoAlarma: tipo,
    periodo: periodo,
    fechaEvento: { $gte: inicio },
  });

  return !existing;
};


const notifyUsers = async (alarm) => {
  try {
    const users = await Users.find({
      enabled: true,
      email: { $exists: true, $ne: null }
    });

    if (!users.length) {
      console.log("No hay usuarios para notificar");
      return;
    }

    const emails = users.map(user => user.email);

    await sendAlarmMail(alarm, emails);

    console.log(`Emails enviados a ${emails.length} usuario(s)`);
  } catch (error) {
    console.error("Error enviando emails:", error);
  }
};



/**
 * 🧾 Crear alarma
 */
const createAlarm = async (config, payload) => {
  const alarmaId = await getNextAlarmId();

  const doc = {
    alarmaId,
    dispositivoId: config.dispositivoId,
    nombre: config.nombre,
    ubicacion: config.ubicacion,
    tipoAlarma: payload.tipoAlarma,
    descripcion: payload.descripcion,
    consumoActual: payload.consumoActual,
    consumoLimite: payload.consumoLimite,
    unidad: payload.unidad,
    periodo: payload.periodo,
    fechaVencimiento: payload.fechaVencimiento,
    diasRestantes: payload.diasRestantes,
    estado: "activa",
    fechaEvento: new Date(),
  };

  const alarm = await Alarma.create(doc);

  notifyUsers(alarm).catch(err =>
    console.error("Error notificando usuarios:", err)
  );

  return alarm;
};
/**
 * ⚙️ Procesamiento principal
 */
const processConfiguration = async (config) => {
  if (!config.habilitada) return null;

  const tipo = normalizeTipo(config.tipoAlarma);
  const periodo = (config.periodo || "MENSUAL").toUpperCase();

  /**
   * 🔌 CONSUMO
   */
  if (tipo === "CONSUMO_EXCEDIDO") {
    if (!config.consumoLimite || config.consumoLimite <= 0) return null;

    const { inicio, fin } = getRangeForPeriod(periodo);

    const consumo = await calculateConsumption(
      config.dispositivoId,
      inicio,
      fin
    );

    if (consumo.energia_activa_kWh <= config.consumoLimite) return null;

    const canCreate = await shouldCreateAlarm(config, tipo, periodo);
    if (!canCreate) return null;

    const descripcion = `Se excedió el consumo ${periodo.toLowerCase()}`;

    return createAlarm(config, {
      tipoAlarma: tipo,
      descripcion,
      consumoActual: consumo.energia_activa_kWh,
      consumoLimite: config.consumoLimite,
      unidad: config.unidad,
      periodo,
    });
  }

  /**
   * 💰 FACTURA
   */
  if (tipo === "PAGO_FACTURA") {
    if (!config.fechaVencimiento) return null;

    const now = new Date();
    const vencimiento = new Date(config.fechaVencimiento);

    const diffDays = Math.ceil((vencimiento - now) / MS_PER_DAY);

    if (diffDays > config.diasAnticipacion || diffDays < 0) return null;

    const canCreate = await shouldCreateAlarm(config, tipo, periodo);
    if (!canCreate) return null;

    const descripcion =
      diffDays >= 0
        ? `Factura vence en ${diffDays} día${diffDays === 1 ? "" : "s"}`
        : `Factura vencida hace ${Math.abs(diffDays)} día${
            Math.abs(diffDays) === 1 ? "" : "s"
          }`;

    return createAlarm(config, {
      tipoAlarma: tipo,
      descripcion,
      consumoActual: 0,
      consumoLimite: config.consumoLimite || 0,
      unidad: config.unidad,
      periodo,
      fechaVencimiento: vencimiento,
      diasRestantes: diffDays,
    });
  }

  /**
   * ⚡ TENSION
   */
  if (tipo === "TENSION_ALTA" || tipo === "TENSION_BAJA") {
    const threshold =
      config.consumoLimite || (tipo === "TENSION_ALTA" ? 240 : 210);

    const inicioDia = startOfDay(new Date());

    const listado = await Log.find({
      nodoId: config.dispositivoId,
      ts: {
        $gte: inicioDia,
        $lte: new Date(),
      },
    }).sort({ ts: 1 });

    if (!listado.length) return null;

    const valores = listado
      .map((item) => item.vrms)
      .filter((v) => typeof v === "number");

    if (!valores.length) return null;

    const maxV = Math.max(...valores);
    const minV = Math.min(...valores);

    const actualValue = tipo === "TENSION_ALTA" ? maxV : minV;

    const exceeds =
      tipo === "TENSION_ALTA" ? maxV > threshold : minV < threshold;

    if (!exceeds) return null;

    const canCreate = await shouldCreateAlarm(config, tipo, "DIARIO");
    if (!canCreate) return null;

    const descripcion =
      tipo === "TENSION_ALTA"
        ? `Tensión alta detectada: ${actualValue} V`
        : `Tensión baja detectada: ${actualValue} V`;

    return createAlarm(config, {
      tipoAlarma: tipo,
      descripcion,
      consumoActual: actualValue,
      consumoLimite: threshold,
      unidad: config.unidad,
      periodo: "DIARIO",
    });
  }

  return null;
};

/**
 * 🔁 Scheduler
 */
const checkAlarmConfigurations = async () => {
  const configs = await ConfiguracionAlarma.find({ habilitada: true });
  const created = [];

  for (const config of configs) {
    try {
      const alarm = await processConfiguration(config);
      if (alarm) created.push(alarm);
    } catch (error) {
      console.error(
        `Error procesando configuración ${
          config.configuracionAlarmaId || config.alarmaId
        }:`,
        error
      );
    }
  }

  if (created.length > 0) {
    console.log(
      `Alarm scheduler created ${created.length} new alarm(s).`
    );
  }

  return created;
};

const scheduleIntervalAlarmCheck = () => {
  const delay = nextIntervalDelay();

  setTimeout(() => {
    checkAlarmConfigurations().catch((err) =>
      console.error("Alarm scheduler error:", err)
    );

    setInterval(() => {
      checkAlarmConfigurations().catch((err) =>
        console.error("Alarm scheduler error:", err)
      );
    }, CHECK_INTERVAL_MS);
  }, delay);
};

const startAlarmScheduler = async () => {
  console.log(
    `Starting alarm scheduler every ${CHECK_INTERVAL_HOURS} hour(s)...`
  );

  await checkAlarmConfigurations();
  scheduleIntervalAlarmCheck();
};

module.exports = {
  startAlarmScheduler,
};