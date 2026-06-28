import React from "react"
import type { NextPage } from "next"
import { useRouter } from "next/router"

import { useConsumos }
from "../../api"

import { Layout }
from "../../Components"

import {
  Grid,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material"

import BoltIcon
from "@mui/icons-material/Bolt"

import GitHubIcon
from '@mui/icons-material/GitHub'

import LinkedInIcon
from '@mui/icons-material/LinkedIn'

import InstagramIcon
from '@mui/icons-material/Instagram'

const ConsumoId: NextPage = () => {

  const router =
    useRouter()

  const {
    dispositivoId
  } = router.query ?? {}

  const onBack =
    () => router.back()

  const {
    consumos,
    loading
  } = useConsumos(
    dispositivoId
  )

  const periodos = [

    {
      nombre:
        "Diario",
      data:
        consumos
          ?.diario
    },

    {
      nombre:
        "Semanal",
      data:
        consumos
          ?.semanal
    },

    {
      nombre:
        "Mensual",
      data:
        consumos
          ?.mensual
    },

    {
      nombre:
        "Facturación Actual",
      data:
        consumos
          ?.facturacion_actual
    },

    {
      nombre:
        "Histórico",
      data:
        consumos
          ?.historico
    }
  ]

  if (loading) {
    return (
      <Layout>
        <Typography>
          Cargando...
        </Typography>
      </Layout>
    )
  }

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
            CONSUMOS
            ELÉCTRICOS
          </Typography>

          <Typography
            variant="body2"
          >
            Resumen de
            consumos del
            dispositivo
          </Typography>

        </Paper>


        {/* VOLVER ARRIBA */}
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


        {/* CARDS */}
        <Grid
          container
          spacing={3}
          mb={3}
        >

          <Grid
            item
            xs={12}
            md={6}
          >
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius:
                  "15px"
              }}
            >

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Consumo
                Promedio
                Diario
              </Typography>

              <Typography
                variant="h3"
                mt={2}
              >
                {
                  consumos
                  ?.promedios
                  ?.promedio_diario_kWh
                }{" "}
                kWh
              </Typography>

            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
          >
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius:
                  "15px"
              }}
            >

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Consumo
                Promedio
                Mensual
              </Typography>

              <Typography
                variant="h3"
                mt={2}
              >
                {
                  consumos
                  ?.promedios
                  ?.promedio_mensual_kWh
                }{" "}
                kWh
              </Typography>

            </Paper>
          </Grid>

        </Grid>


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
                  "Periodo",
                  "P (kWh)",
                  "Q (kVARh)",
                  "S (kVAh)",
                  "Cos φ",
                  "Vrms",
                  "Irms",
                  "Muestras"
                ].map(
                  (
                    title
                  ) => (

                    <TableCell
                      key={title}
                      align="center"
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

              {
                periodos.map(
                  (
                    periodo,
                    index
                  ) => (

                    <TableRow
                      key={index}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor:
                            "#ECEFF1"
                        }
                      }}
                    >

                      <TableCell align="center">
                        {periodo.nombre}
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.energia_activa_kWh
                        }
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.energia_reactiva_kVARh
                        }
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.energia_aparente_kVAh
                        }
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.cos_phi_promedio
                        }
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.vrms_promedio
                        } V
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.irms_promedio
                        } A
                      </TableCell>

                      <TableCell align="center">
                        {
                          periodo
                            .data
                            ?.muestras
                        }
                      </TableCell>

                    </TableRow>
                  )
                )
              }

            </TableBody>

          </Table>

        </TableContainer>


        {/* VOLVER ABAJO */}
        <div
          style={{
            marginTop:
              "20px",
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


        {/* FOOTER */}
        <Paper
          elevation={4}
          sx={{
            marginTop:
              "auto",
            background:
              "#263238",
            color:
              "white",
            padding:
              "22px",
            textAlign:
              "center",
            borderRadius:
              "12px"
          }}
        >

          <Typography
            variant="h6"
            sx={{
              fontWeight:
                "bold",
              marginBottom:
                "8px"
            }}
          >
            SISTEMA IoT DE
            MONITOREO ELÉCTRICO
          </Typography>

          <Typography
            variant="body2"
            sx={{
              marginBottom:
                "18px",
              color:
                "#CFD8DC"
            }}
          >
            Plataforma para monitoreo
            de variables eléctricas
            en tiempo real
          </Typography>


          {/* REDES */}
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "center",
              gap:
                "15px",
              marginBottom:
                "15px",
              flexWrap:
                "wrap"
            }}
          >

            <Button
              variant="contained"
              startIcon={<GitHubIcon />}
              href="https://github.com/"
              target="_blank"
              sx={{
                backgroundColor:
                  "#424242"
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
                backgroundColor:
                  "#1565C0"
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
                backgroundColor:
                  "#AD1457"
              }}
            >
              Instagram
            </Button>

          </div>

          <Typography
            variant="body2"
            sx={{
              color:
                "#B0BEC5"
            }}
          >
            Proyecto Final - CeIoT
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color:
                "#90A4AE"
            }}
          >
            Ingeniería Electrónica • IoT • Monitoreo Energético
          </Typography>

        </Paper>

      </div>

    </Layout>
  )
}

export default ConsumoId