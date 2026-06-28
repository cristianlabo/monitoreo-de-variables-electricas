const dispositivo = require("./models/dispositivos");
const logs = require("./models/logs");
const alarma = require("./models/alarmas");
const ConfiguracionAlarma = require("./models/configuracion_alarmas");
const User = require("./models/users");
const clientMqtt = require("../../storage/mqtt");
const options = clientMqtt.MQTTOptions;
var arrayTopicsListen = ["/CASA/FRENTE/ENERGIA_ELECTRICA"];
var arrayTopicsServer = ["/CASA/FRENTE/ENERGIA_ELECTRICA"];



const moment = require('moment');





clientMqtt.on("connect", async function () {
    //BUSCO TODOS LOS NODOS NO REPETIDOS
    const buscarAllnodos = await dispositivo.find().distinct("nodoId");
    for (var nodo in buscarAllnodos) {
        arrayTopicsListen.push(buscarAllnodos[nodo].topic);
        arrayTopicsServer.push(buscarAllnodos[nodo].topicSrvResponse);
    }
    //	process.env.ARRAYTOPICOS=arrayTopics;
    //	process.env.ARRAYTOPICOS_SRV=arrayT_srv;

    clientMqtt.subscribe(arrayTopicsListen, options, () => {
        console.log("Subscribed to topics: ");
        console.log(arrayTopicsListen);
    });
    //console.log(arrayTopicsServer);
    // ['luz1', 'luz2', 'temperatura', 'humedad', 'dispositivoId', 'nombre', 'ubicacion'];
   /*  for (var elemento in arrayTopicsServer) {
        console.log("MQTT: " + elemento);
         const mensaje = {
            dispositivoId: Number(elemento),
            nombre: "ESP32_TEMP_NODEjs",
            ubicacion: "Terraza",
            logId: 1,
            ts: new Date().getTime() ,
            temperatura: 15,
            nodoId: 0,
        }; 
    

        const payload = JSON.stringify(mensaje);
        // Publico mensajes al inicio del servicio para verificar la subscripción
        clientMqtt.publish(arrayTopicsServer[elemento], payload, options, (error) => {
            if (error) {
                console.log(error);
            }
        })
    } */
    clientMqtt.on("message", async (topic, payload) => {
        console.log("[MQTT] Mensaje recibido: " + topic + ": " + payload.toString());
        var mensaje = payload.toString();
        let jason;
        try {
            jason = JSON.parse(mensaje);
        } catch (error) {
            console.log("FORMATO INCORRECTO, DEBE ENVIAR MENSAJES EN FORMATO JSON");
            return; // Salir de la función en caso de error de formato
        }
        // Verificar la existencia de todos los campos
        const camposEsperados = [
            'vrms',
            'irms',
            'potencia_activa',
            'potencia_reactiva', 
            'potencia_aparente',
            'cos_phi',
            'dispositivoId',
            'nombre',
            'ubicacion',
            'nodoId'
        ];
        const camposFaltantes = camposEsperados.filter((campo) => !(campo in jason));
        if (camposFaltantes.length > 0) {
            console.log('CAMPOS FALTANTES: ', camposFaltantes.join(', '));
            return;
        }
        // Validar el formato del JSON
        if (
            typeof jason.vrms !== 'number' ||
            typeof jason.irms !== 'number' ||
            typeof jason.potencia_activa !== 'number' ||
            typeof jason.potencia_reactiva !== 'number' ||
            typeof jason.potencia_aparente !== 'number' ||
            typeof jason.cos_phi !== 'number' ||
            typeof jason.dispositivoId !== 'number' ||
            typeof jason.nombre !== 'string' ||
            typeof jason.ubicacion !== 'string'
        ) {
            console.log('FORMATO INCORRECTO');
            return;
        }


        // busco coincidencia de topic y nombre de dispositivo en la DB
        const buscarDispositivo = await dispositivo.findOne({
            topic: topic,
            nombre: jason.nombre,
        });

        if (buscarDispositivo) { // Si el dispositivo existe agrego un log
            var eltime = new Date(); 
            console.log("elTime:"+eltime);
            var elnodo = buscarDispositivo.dispositivoId;
            //console.log("[LOG] Nodo: " + elnodo);
            const id = await logs.findOne().sort({ "ts": -1 }).limit(1); // para obtener el maximo
            const lid = id?.logId ?? 1;
            console.log("[LOG] id: " +id );
            console.log("termino el calculo del id del LOG :"+ lid);

            const elLog = new logs({
                logId: lid + 1,
                ts: new Date(),
                vrms: parseFloat(jason.vrms.toFixed(1)),
                irms: parseFloat(jason.irms.toFixed(2)),
                potencia_activa: parseFloat(jason.potencia_activa.toFixed(0)),
                potencia_reactiva: parseFloat(jason.potencia_reactiva.toFixed(0)),
                potencia_aparente: parseFloat(jason.potencia_aparente.toFixed(0)),
                cos_phi: parseFloat(jason.cos_phi.toFixed(2)),
                nodoId: elnodo
            });
            //console.log(elLog);
            try {
                const savedLog = await elLog.save();
                console.log("REGISTRO DE LOG AGREGADO CORRECTAMENTE.");
            } catch (error) {
                console.log("ERROR UPDATING");
            }
            //ACTUALIZO Dispositivo EN MONGO
            await dispositivo.findOneAndUpdate(
                { dispositivoId: elnodo },
                {
                    vrms: parseFloat(jason.vrms.toFixed(1)),
                    irms: parseFloat(jason.irms.toFixed(2)),
                    potencia_activa: parseFloat(jason.potencia_activa.toFixed(0)),
                    potencia_reactiva: parseFloat(jason.potencia_reactiva.toFixed(0)),
                    potencia_aparente: parseFloat(jason.potencia_aparente.toFixed(0)),
                    cos_phi: parseFloat(jason.cos_phi.toFixed(2)),
                }
            )
            .then(book => {
                if (!book) {
                    console.log("DISPOSITIVO NO ENCONTRADO.");
                    return;
                }

                console.log("DISPOSITIVO ACTUALIZADO.");
            })
            .catch(err => {
                console.log("ERROR ACTUALIZANDO DISPOSITIVO:");
                console.log(err.message);
            });

        } else { // Si no existe creo un nuevo dispositivo
            console.log("Nodo no registrarlo, procedo a crearlo.");
            console.log("Topic recibido: " + topic);
            console.log("Datos del nodo: ");
            console.log(jason);
            // agrego un nuevo nodo en mongo
            const nuevodisp = new dispositivo({
                dispositivoId: jason.dispositivoId,
                nombre: jason.nombre,
                ubicacion: jason.ubicacion,
                vrms: parseFloat(jason.vrms.toFixed(1)),
                irms: parseFloat(jason.irms.toFixed(2)),
                potencia_activa: parseFloat(jason.potencia_activa.toFixed(0)),
                potencia_reactiva: parseFloat(jason.potencia_reactiva.toFixed(0)),
                potencia_aparente: parseFloat(jason.potencia_aparente.toFixed(0)),
                cos_phi: parseFloat(jason.cos_phi.toFixed(2)),

                topic: topic,
                topicSrvResponse: topic
            });
            console.log("NEWDISP: " + nuevodisp);
            //console.log("Dispositivo nuevo creado ok");
            try {
                const savedDisp = await nuevodisp.save();
                console.log("NUEVO NODO AGREGADO CORRECTAMENTE.");
            } catch (error) {
                console.log("ERROR UPDATING");
            }
            // Agrego el log del nodo creado
            var eltime = new Date(); // fechaOriginal.setHours(fechaOriginal.getHours() - 3)
            console.log("elTime:"+eltime);

            var elnodo = jason.dispositivoId;
            //console.log("[LOG] Nodo: " + elnodo);
            //const id = await logs.find().sort({ "logId": -1 }).limit(1); // para obtener el maximo

            const id = await logs.findOne().sort({ "ts": -1 }).limit(1); // para obtener el maximo
            const lid = id?.logId ?? 0;

            console.log("[LOG] id: " +id );
            console.log("termino el calculo del id del LOG :"+ lid);

            const elLog = new logs({
                logId: lid + 1,
                ts: new Date(),
                vrms: parseFloat(jason.vrms.toFixed(1)),
                irms: parseFloat(jason.irms.toFixed(2)),
                potencia_activa: parseFloat(jason.potencia_activa.toFixed(0)),
                potencia_reactiva: parseFloat(jason.potencia_reactiva.toFixed(0)),
                potencia_aparente: parseFloat(jason.potencia_aparente.toFixed(0)),
                cos_phi: parseFloat(jason.cos_phi.toFixed(2)),

                nodoId: elnodo
            });
            //console.log(elLog);
            try {
                const savedLog = await elLog.save();
                console.log("REGISTRO DE LOG AGREGADO CORRECTAMENTE.");
            } catch (error) {
                console.log("ERROR UPDATING");
            }
        }
    })

})


async function calcularConsumo(nodoId, fechaInicio, fechaFin) {

    const listado = await logs
        .find({
            nodoId: Number(nodoId),
            ts: {
                $gte: fechaInicio,
                $lte: fechaFin
            }
        })
        .sort({ ts: 1 });

    if (!listado.length) {
        return {
            energia_activa_kWh: 0,
            energia_reactiva_kVARh: 0,
            energia_aparente_kVAh: 0,
            cos_phi_promedio: 0,
            vrms_promedio: 0,
            irms_promedio: 0,
            muestras: 0
        };
    }

    let energiaActivaWh = 0;
    let energiaReactivaVARh = 0;
    let energiaAparenteVAh = 0;

    let sumaCosPhi = 0;
    let sumaVrms = 0;
    let sumaIrms = 0;

    for (let i = 0; i < listado.length - 1; i++) {

        const actual = listado[i];
        const siguiente = listado[i + 1];

        const deltaSegundos =
            (new Date(siguiente.ts) - new Date(actual.ts)) / 1000;

        energiaActivaWh +=
            (actual.potencia_activa * deltaSegundos) / 3600;

        energiaReactivaVARh +=
            (actual.potencia_reactiva * deltaSegundos) / 3600;

        energiaAparenteVAh +=
            (actual.potencia_aparente * deltaSegundos) / 3600;

        sumaCosPhi += actual.cos_phi;
        sumaVrms += actual.vrms;
        sumaIrms += actual.irms;
    }

    return {
        energia_activa_kWh:
            Number((energiaActivaWh / 1000).toFixed(3)),

        energia_reactiva_kVARh:
            Number((energiaReactivaVARh / 1000).toFixed(3)),

        energia_aparente_kVAh:
            Number((energiaAparenteVAh / 1000).toFixed(3)),

        cos_phi_promedio:
            Number((sumaCosPhi / listado.length).toFixed(3)),

        vrms_promedio:
            Number((sumaVrms / listado.length).toFixed(2)),

        irms_promedio:
            Number((sumaIrms / listado.length).toFixed(2)),

        muestras: listado.length
    };
}

const register = (router) => {
    router.get("/status", (req, resp) => resp.json({ status: 200 }));

    router.get('/dispositivos', async function (req, res) {
        const listado = await dispositivo.find();
        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/dispositivos/:id', async function (req, res) {

        const listado = await dispositivo.findOne({ "_id": req.params.id });
        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/logs', async function (req, res) {
        const listado = await logs.find();//.sort({ ts: -1 });
        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/logs/paginar', async function (req, res) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
            const nodoId = req.query.nodoId ? Number(req.query.nodoId) : undefined;
            const sortBy = req.query.sortBy || 'ts';
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
            const mode = req.query.mode || 'latest';

            const filter = {};
            if (nodoId !== undefined && !Number.isNaN(nodoId)) {
                filter.nodoId = nodoId;
            }

            const total = await logs.countDocuments(filter);
            const totalPages = Math.max(1, Math.ceil(total / limit));

            const order = mode === 'historic' ? 1 : sortOrder;

            const listado = await logs
                .find(filter)
                .sort({ [sortBy]: order })
                .skip((page - 1) * limit)
                .limit(limit);

            return res.json({
                data: {
                    items: listado,
                    page,
                    limit,
                    total,
                    totalPages,
                    mode,
                    sortBy,
                    sortOrder: order === 1 ? 'asc' : 'desc',
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                error: null
            });
        } catch (error) {
            return res.status(500).json({ data: null, error: error.message });
        }
    });

    router.get('/logs/:nodoId', async function (req, res) {
       
        const listado = await logs.find({ "nodoId": req.params.nodoId }).sort({ ts: -1 });
       // console.log(listado);
        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/alarmas', async function (req, res) {
        const listado = await alarma.find().sort({ fechaEvento: -1 });

        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/alarmas/:dispositivoId', async function (req, res) {

        const listado = await alarma.find({
            dispositivoId: req.params.dispositivoId
        }).sort({ fechaEvento: -1 });

        if (!listado) return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });
        if (listado) return res.json({ data: listado, error: null });
    });

    router.get('/configuracion-alarmas', async (req, res) => {
        const listado = await ConfiguracionAlarma.find().sort({ fechaCreacion: -1 });

        if (!listado)
            return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });

        return res.json({ data: listado, error: null });
    });


    router.get('/configuracion-alarmas/:dispositivoId', async (req, res) => {
        const listado = await ConfiguracionAlarma
            .find({ dispositivoId: req.params.dispositivoId })
            .sort({ fechaCreacion: -1 });

        if (!listado)
            return res.json({ data: null, error: 'No hay datos en la Base de Datos.' });

        return res.json({ data: listado, error: null });
    });

    router.get("/users", async (req, res) => {

        try {

            const users =
                await User.find({})
                    .sort({
                        username: 1
                    });

            return res.json({
                data:
                    users,
                error:
                    null
            });

        } catch (error) {

            return res.status(500).json({
                data:
                    null,
                error:
                    error.message
            });

        }

    })
    
    router.get("/users/:username", async (req, res) => {
        try {

            const user = await User.findOne({
                username: req.params.username
            })

            return res.json({
                data: user || null,
                error: user ? null : "Usuario no encontrado."
            })

        } catch (error) {
            return res.status(500).json({
                data: null,
                error: error.message
            })
        }
    })

    
    /* ==========================
    CREAR USUARIO
    ========================== */
    router.post(
        "/users",
        async (req, res) => {

            try {

            const {
                username,
                password,
                email,
                role = "USER",
                enabled = true
            } = req.body;

            const exists =
                await User.findOne({
                username
                });

            if (exists)
                return res.status(400).json({
                data: null,
                error: "El usuario ya existe."
                });

            const user =
                await User.create({
                username,
                password,
                email,
                role,
                enabled
                });

            res.status(201).json({
                data: user,
                error: null
            });

            } catch (error) {

            res.status(500).json({
                data: null,
                error: error.message
            });

            }

        }
    );


    /* ==========================
    ACTUALIZAR USUARIO
    ========================== */
    router.put(
        "/users/:username",
        async (req, res) => {

            try {

            const user =
                await User.findOneAndUpdate(

                {
                    username:
                    req.params.username
                },

                req.body,

                {
                    new: true
                }

                );

            if (!user)
                return res.status(404).json({
                data: null,
                error: "Usuario no encontrado."
                });

            res.json({
                data: user,
                error: null
            });

            } catch (error) {

            res.status(500).json({
                data: null,
                error: error.message
            });

            }

        }
    );


    /* ==========================
    ELIMINAR USUARIO
    ========================== */
    router.delete(
        "/users/:username",
        async (req, res) => {

            try {

            const user =
                await User.findOne({
                username:
                    req.params.username
                });

            if (!user)
                return res.status(404).json({
                data: null,
                error: "Usuario no encontrado."
                });

            if (
                user.role === "ADMIN"
            )
                return res.status(403).json({
                data: null,
                error: "No se puede eliminar un ADMIN."
                });

            await User.deleteOne({
                username:
                req.params.username
            });

            res.json({
                data: true,
                error: null
            });

            } catch (error) {

            res.status(500).json({
                data: null,
                error: error.message
            });

            }

        }
    );


    /* ==========================
    CREAR CONFIGURACIÓN ALARMA
    ========================== */
    router.post(
    "/configuracion-alarmas",
    async (req, res) => {

        try {

        const {

            configuracionAlarmaId,
            dispositivoId,
            nombre,
            ubicacion,
            tipoAlarma,
            habilitada = true,
            mensaje,
            prioridad,

            consumoLimite,
            unidad,
            periodo,

            fechaVencimiento,
            diasAnticipacion

        } = req.body;

        const exists =
            await ConfiguracionAlarma.findOne({
            configuracionAlarmaId
            });

        if (exists)
            return res.status(400).json({
            data: null,
            error:
                "La configuración de alarma ya existe."
            });

        const configuracion =
            await ConfiguracionAlarma.create({

            configuracionAlarmaId,
            dispositivoId,
            nombre,
            ubicacion,
            tipoAlarma,
            habilitada,
            mensaje,
            prioridad,

            consumoLimite,
            unidad,
            periodo,

            fechaVencimiento,
            diasAnticipacion,

            fechaCreacion:
                new Date(),

            fechaActualizacion:
                new Date()

            });

        res.status(201).json({
            data:
            configuracion,
            error:
            null
        });

        } catch (error) {

        res.status(500).json({
            data: null,
            error:
            error.message
        });

        }

    }
    );



    /* ==========================
    ACTUALIZAR CONFIGURACIÓN
    ========================== */
    router.put(
    "/configuracion-alarmas/:id",
    async (req, res) => {

        try {

        const query = {
            $or: [
                { configuracionAlarmaId: Number(req.params.id) },
                { alarmaId: Number(req.params.id) }
            ]
        };

        const configuracion =
            await ConfiguracionAlarma.findOneAndUpdate(

            query,

            {
                ...req.body,

                fechaActualizacion:
                new Date()
            },

            {
                new: true
            }

            );

        if (!configuracion)
            return res.status(404).json({
            data: null,
            error:
                "Configuración no encontrada."
            });

        res.json({
            data:
            configuracion,
            error:
            null
        });

        } catch (error) {

        res.status(500).json({
            data: null,
            error:
            error.message
        });

        }

    }
    );



    /* ==========================
    ELIMINAR CONFIGURACIÓN
    ========================== */
    router.delete(
    "/configuracion-alarmas/:id",
    async (req, res) => {

        try {

        const query = {
            $or: [
                { configuracionAlarmaId: Number(req.params.id) },
                { alarmaId: Number(req.params.id) }
            ]
        };

        const configuracion =
            await ConfiguracionAlarma.findOne(query);

        if (!configuracion)
            return res.status(404).json({
            data: null,
            error:
                "Configuración no encontrada."
            });

        await ConfiguracionAlarma.deleteOne(query);

        res.json({
            data: true,
            error: null
        });

        } catch (error) {

        res.status(500).json({
            data: null,
            error:
            error.message
        });

        }

    }
    );



    router.get('/consumo/:nodoId', async function (req, res) {

        try {

            const nodoId = Number(req.params.nodoId);
            const hoy = new Date();

            // -------------------------
            // DIARIO
            // -------------------------
            const inicioDia = new Date();
            inicioDia.setHours(0, 0, 0, 0);

            // -------------------------
            // SEMANAL
            // -------------------------
            const inicioSemana = new Date();
            inicioSemana.setDate(hoy.getDate() - 7);

            // -------------------------
            // MENSUAL
            // -------------------------
            const inicioMes = new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                1
            );

            // -------------------------
            // FACTURACION
            // 15 mes anterior -> hoy
            // -------------------------
            const inicioFacturacion = new Date(
                hoy.getMonth() === 0
                    ? hoy.getFullYear() - 1
                    : hoy.getFullYear(),

                hoy.getMonth() === 0
                    ? 11
                    : hoy.getMonth() - 1,

                15
            );

            // -------------------------
            // HISTORICO
            // -------------------------
            const primerLog = await logs
                .findOne({ nodoId })
                .sort({ ts: 1 });

            const inicioHistorico =
                primerLog?.ts || inicioDia;

            // Calcular todo en paralelo
            const [
                diario,
                semanal,
                mensual,
                facturacionActual,
                historico
            ] = await Promise.all([

                calcularConsumo(
                    nodoId,
                    inicioDia,
                    hoy
                ),

                calcularConsumo(
                    nodoId,
                    inicioSemana,
                    hoy
                ),

                calcularConsumo(
                    nodoId,
                    inicioMes,
                    hoy
                ),

                calcularConsumo(
                    nodoId,
                    inicioFacturacion,
                    hoy
                ),

                calcularConsumo(
                    nodoId,
                    inicioHistorico,
                    hoy
                )
            ]);

            // -------------------------
            // PROMEDIOS HISTORICOS
            // -------------------------

            const diasHistoricos =
                Math.max(
                    1,
                    Math.ceil(
                        (hoy - new Date(inicioHistorico))
                        / (1000 * 60 * 60 * 24)
                    )
                );

            const promedioDiarioKWh =
                historico.energia_activa_kWh
                / diasHistoricos;

            const promedioMensualKWh =
                promedioDiarioKWh * 30;

            return res.json({
                data: {
                    nodoId,

                    diario,

                    semanal,

                    mensual,

                    facturacion_actual: {
                        fecha_inicio:
                            inicioFacturacion,

                        fecha_fin: hoy,

                        ...facturacionActual
                    },

                    historico,

                    promedios: {
                        promedio_diario_kWh:
                            Number(
                                promedioDiarioKWh
                                    .toFixed(3)
                            ),

                        promedio_mensual_kWh:
                            Number(
                                promedioMensualKWh
                                    .toFixed(3)
                            )
                    }
                },

                error: null
            });

        } catch (error) {

            return res.status(500).json({
                data: null,
                error: error.message
            });
        }
    });

    router.patch(
        '/alarmas/:alarmaId/resolver',
        async function (req, res) {

        try {

            const alarmaId =
                Number(req.params.alarmaId);

            const alarmaActualizada =
                await alarma.findOneAndUpdate(
                    {
                        alarmaId
                    },
                    {
                        estado: "resuelta"
                    },
                    {
                        new: true
                    }
                );

            if (!alarmaActualizada) {
                return res.status(404).json({
                    data: null,
                    error:
                        "Alarma no encontrada."
                });
            }

            return res.json({
                data:
                    alarmaActualizada,
                error: null
            });

        } catch (error) {

            return res.status(500).json({
                data: null,
                error: error.message
            });
        }
    });
    
    return router;
};

module.exports = {
    register,
};
