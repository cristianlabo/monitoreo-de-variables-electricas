import React from "react"
import Link from 'next/link'
import { Paper, Typography, Grid } from "@mui/material"

// controla el home de dispositivos

export interface ItemProps {
    dispositivoId?: any;
    nombre?: any;
    ubicacion?: any;
    id?: any;
    vrms?: any;
    irms?: any;
    potencia_activa?: any;
    potencia_reactiva?: any;
    potencia_aparente?: any;
    cos_phi?: any;
}


export const Item = ({
    dispositivoId,
    nombre,
    ubicacion,
    id,
    vrms,
    irms,
    potencia_activa,
    potencia_reactiva,
    potencia_aparente,
    cos_phi
}: ItemProps) => {
    return (
        <Link href={`/dispositivos/${dispositivoId}`}>
            <Paper elevation={3} style={{ margin: 10, padding: 20 }}>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>Nombre</Typography>
                    <Typography variant="h6">: {nombre}</Typography>
                </div>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>DispositivoId</Typography>
                    <Typography variant="h6">: {dispositivoId}</Typography>
                </div>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>Ubicacion</Typography>
                    <Typography variant="h6">: {ubicacion}</Typography>
                </div>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        VRMS
                    </Typography>
                    <Typography variant="h6">
                        : {vrms} V
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        IRMS
                    </Typography>
                    <Typography variant="h6">
                        : {irms} A
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia activa(P)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_activa} W
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia reactiva(Q)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_reactiva} var
                    </Typography>
                </div>


                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia aparente(S)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_aparente} VA
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Cos φ
                    </Typography>
                    <Typography variant="h6">
                        : {cos_phi}
                    </Typography>
                </div>
            </Paper>
        </Link>
    )
}



export interface ItemLogs {
    logId?: any;
    ts?: any;
    nodoId?: any;
    vrms?: any;
    irms?: any;
    potencia_activa?: any;
    potencia_reactiva?: any;
    potencia_aparente?: any;
    cos_phi?: any;
}




export const ItemLog = ({
    logId,
    ts,
    vrms,
    irms,
    potencia_activa,
    potencia_reactiva,
    potencia_aparente,
    cos_phi,
    nodoId
}: ItemLogs) => {
    return (
        // <Link href={`/status/`}>
            <Paper elevation={3} style={{ margin: 10, padding: 20 }}>
            <   div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>logId</Typography>
                    <Typography variant="h6">: {logId}</Typography>
                </div>
                <div style={{ display: "flex" }}>
                <Typography
                    variant="h6"
                    style={{ fontWeight: "bold" }}
                >
                    Tiempo de medicion
                </Typography>

                <Typography variant="h6">
                    : {
                    new Date(ts).toLocaleString(
                        'es-AR',
                        {
                        timeZone:
                            'America/Argentina/Buenos_Aires',

                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',

                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',

                        hour12: false
                        }
                    )
                    }
                </Typography>
                </div>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        VRMS
                    </Typography>
                    <Typography variant="h6">
                        : {vrms} V
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        IRMS
                    </Typography>
                    <Typography variant="h6">
                        : {irms} A
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia activa(P)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_activa} W
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia reactiva(Q)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_reactiva} Var
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Potencia aparente(S)
                    </Typography>
                    <Typography variant="h6">
                        : {potencia_aparente} VA
                    </Typography>
                </div>

                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>
                        Cos φ
                    </Typography>
                    <Typography variant="h6">
                        : {cos_phi}
                    </Typography>
                </div>
                <div style={{ display: "flex" }}>
                    <Typography variant="h6" style={{ fontWeight: "bold" }}>nodoId</Typography>
                    <Typography variant="h6">: {nodoId}</Typography>
                </div>
            </Paper>
        // </Link>
    )
}

export default Item;