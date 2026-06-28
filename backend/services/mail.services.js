const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendAlarmMail = async (alarm, recipients) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,

    // Mejor BCC para no exponer mails
    bcc: recipients,

    subject: `Nueva alarma: ${alarm.tipoAlarma}`,

    html: `
      <h2>Nueva alarma registrada</h2>

      <p><b>Tipo:</b> ${alarm.tipoAlarma}</p>
      <p><b>Descripción:</b> ${alarm.descripcion}</p>
      <p><b>Dispositivo:</b> ${alarm.nombre}</p>
      <p><b>Ubicación:</b> ${alarm.ubicacion}</p>
      <p><b>Fecha:</b> ${alarm.fechaEvento}</p>
    `
  });
};

module.exports = {
  sendAlarmMail
};