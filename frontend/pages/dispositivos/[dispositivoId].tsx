import React, { useState } from "react"
import type { NextPage } from "next"
import { useRouter } from "next/router"

import { useLogsPaginado }
from "./../../api"

import { Layout }
from "./../../Components"

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Pagination
} from "@mui/material"

import BoltIcon
from "@mui/icons-material/Bolt"

import {
  formatDate,
  formatDateTimeShort,
  formatTime,
} from "../../utils"

import GitHubIcon
from '@mui/icons-material/GitHub'

import LinkedInIcon
from '@mui/icons-material/LinkedIn'

import InstagramIcon
from '@mui/icons-material/Instagram'

import * as Recharts from "recharts"

const {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} = Recharts as any

const DispositivoId: NextPage = () => {

  const router = useRouter()

  const {
    dispositivoId
  } = router.query ?? {}

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(1440)

  const onBack =
    () => router.back()

  const { 
    items: logs,
    total,
    totalPages,
    mutateLogs
  } =
    useLogsPaginado(
      dispositivoId,
      currentPage,
      itemsPerPage,
      'ts',
      'desc'
    )

  // ==========================
  // ORDEN GRAFICOS
  // viejo -> nuevo
  // ==========================
  const logsOrdenados =
    [...(logs || [])]
      .sort(
        (
          a: any,
          b: any
        ) =>
          new Date(a.ts)
            .getTime()
          -
          new Date(b.ts)
            .getTime()
      )

  // ==========================
  // DATA PARA GRAFICOS
  // ==========================
  const chartData =
    logsOrdenados.map(
      (
        log: any,
        index: number,
        array: any[]
      ) => {

        const fecha =
          new Date(log.ts)

        const diaActual = formatDate(fecha)

        const diaAnterior =
          index > 0
            ? formatDate(
                new Date(
                  array[index - 1].ts
                )
              )
            : null

        return {

          hora: formatTime(fecha),

          dia:
            diaActual !==
            diaAnterior
              ? diaActual
              : "",

          vrms:
            log.vrms,

          irms:
            log.irms,

          p:
            log.potencia_activa,

          q:
            log.potencia_reactiva,

          s:
            log.potencia_aparente,

          cosphi:
            log.cos_phi
        }
      }
    )

  // ==========================
  // FUNCION GRAFICO
  // ==========================
  const renderChart = (
    title: string,
    dataKey: string,
    color: string
  ) => (

    <Paper
      elevation={4}
      sx={{
        p: 2,
        mb: 3,
        borderRadius:
          "15px"
      }}
    >

      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
      >
        {title}
      </Typography>

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 70
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="hora"
            height={30}
            tick={{
              fontSize: 10
            }}
            tickLine={false}
          />

          <XAxis
            xAxisId="dias"
            dataKey="dia"
            orientation="bottom"
            axisLine={false}
            tickLine={false}
            interval={0}
            height={70}
            tick={{
              fontSize: 10
            }}
            angle={-35}
            textAnchor="end"
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </Paper>
  )

  return (

    <Layout>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >

        {/* HEADER */}
        <Paper
          elevation={4}
          sx={{
            background:
              "#263238",
            color:
              "white",
            padding:
              "25px",
            marginBottom:
              "25px",
            borderRadius:
              "12px",
            textAlign:
              "center"
          }}
        >

          <BoltIcon
            sx={{
              fontSize:
                55,
              color:
                "#FFC107"
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
          >
            DETALLE DE
            MEDICIONES
          </Typography>

          <Typography
            variant="body2"
          >
            Historial de
            variables
            eléctricas del
            dispositivo
          </Typography>

        </Paper>

        {/* BOTON ARRIBA */}
        <div
          style={{
            marginBottom:
              "20px",
            display:
              "flex",
            justifyContent:
              "flex-start"
          }}
        >
          <Button
            variant="contained"
            onClick={onBack}
            sx={{
              backgroundColor:
                "#455A64",

              '&:hover': {
                backgroundColor:
                  "#37474F"
              }
            }}
          >
            VOLVER
          </Button>
        </div>

        {/* GRAFICOS */}
        {renderChart(
          "Tensión RMS (Vrms)",
          "vrms",
          "#1976D2"
        )}

        {renderChart(
          "Corriente RMS (Irms)",
          "irms",
          "#388E3C"
        )}

        {renderChart(
          "Potencia Activa (P)",
          "p",
          "#F57C00"
        )}

        {renderChart(
          "Potencia Reactiva (Q)",
          "q",
          "#7B1FA2"
        )}

        {renderChart(
          "Potencia Aparente (S)",
          "s",
          "#D32F2F"
        )}

        {renderChart(
          "Factor de Potencia (Cos φ)",
          "cosphi",
          "#455A64"
        )}

        {/* PAGINACIÓN DE GRÁFICOS */}
        <Paper
          elevation={4}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "15px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ mr: 2 }}>
            Página {currentPage} de {totalPages} ({total} registros totales)
          </Typography>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Paper>

        {/* TABLA */}
        <TableContainer
          component={Paper}
          elevation={4}
          sx={{
            borderRadius:
              "15px",
            overflow:
              "hidden"
          }}
        >

          <Table>

            <TableHead>

              <TableRow
                sx={{
                  backgroundColor:
                    "#37474F"
                }}
              >

                {[
                  "Log ID",
                  "Fecha",
                  "Vrms",
                  "Irms",
                  "P (W)",
                  "Q (VAR)",
                  "S (VA)",
                  "Cos φ"
                ].map(
                  (
                    title
                  ) => (

                    <TableCell
                      key={title}
                      align={
                        title ===
                          "Fecha" ||
                        title ===
                          "Log ID"
                          ? "left"
                          : "center"
                      }
                      sx={{
                        color:
                          "white",
                        fontWeight:
                          "bold"
                      }}
                    >
                      {title}
                    </TableCell>
                  )
                )}

              </TableRow>

            </TableHead>

            <TableBody>

              {[...(logs || [])]
                .map(
                  (
                    element: any,
                    index: number
                  ) => (

                    <TableRow
                      key={index}
                      hover
                    >

                      <TableCell>
                        {element.logId}
                      </TableCell>

                      <TableCell>
                        {formatDateTimeShort(element.ts)}
                      </TableCell>

                      <TableCell align="center">
                        {element.vrms} V
                      </TableCell>

                      <TableCell align="center">
                        {element.irms} A
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_activa} W
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_reactiva} VAR
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_aparente} VA
                      </TableCell>

                      <TableCell align="center">
                        {element.cos_phi}
                      </TableCell>

                    </TableRow>
                  )
                )}

            </TableBody>

          </Table>

        </TableContainer>

        {/* PAGINACIÓN DE TABLA */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 3,
            mb: 2
          }}
        >
          <Typography variant="body2">
            Página {currentPage} de {totalPages}
          </Typography>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>

        {/* BOTON ABAJO */}
        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "flex-start"
          }}
        >
          <Button
            variant="contained"
            onClick={onBack}
            sx={{
              backgroundColor:
                "#455A64",

              '&:hover': {
                backgroundColor:
                  "#37474F"
              }
            }}
          >
            VOLVER
          </Button>
        </div>

        {/* FOOTER */}
        <Paper
          elevation={4}
          sx={{
            marginTop: "auto",
            background: "#263238",
            color: "white",
            padding: "22px",
            textAlign: "center",
            borderRadius: "12px"
          }}
        >

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              marginBottom: "8px"
            }}
          >
            SISTEMA IoT DE
            MONITOREO ELÉCTRICO
          </Typography>

          <Typography
            variant="body2"
            sx={{
              marginBottom: "18px",
              color: "#CFD8DC"
            }}
          >
            Plataforma para monitoreo
            de variables eléctricas
            en tiempo real
          </Typography>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "15px",
              flexWrap: "wrap"
            }}
          >

            <Button
              variant="contained"
              startIcon={<GitHubIcon />}
              href="https://github.com/"
              target="_blank"
              sx={{
                backgroundColor: "#424242"
              }}
            >
              GitHub
            </Button>

            <Button
              variant="contained"
              startIcon={<LinkedInIcon />}
              href="https://linkedin.com/"
              target="_blank"
              sx={{
                backgroundColor: "#1565C0"
              }}
            >
              LinkedIn
            </Button>

            <Button
              variant="contained"
              startIcon={<InstagramIcon />}
              href="https://instagram.com/"
              target="_blank"
              sx={{
                backgroundColor: "#AD1457"
              }}
            >
              Instagram
            </Button>

          </div>

          <Typography
            variant="body2"
            sx={{
              color: "#B0BEC5"
            }}
          >
            Proyecto Final - CeIoT
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "#90A4AE"
            }}
          >
            Ingeniería Electrónica • IoT • Monitoreo Energético
          </Typography>

        </Paper>

      </div>

    </Layout>
  )
}

export default DispositivoId