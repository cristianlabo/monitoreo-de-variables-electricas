import React from "react"
import type { NextPage } from "next"
import Link from "next/link"
import { useRouter } from "next/router"

import { Layout }
from "../../Components"

import {
  Grid,
  Paper,
  Typography,
  Button,
  Box
} from "@mui/material"

import BoltIcon
from "@mui/icons-material/Bolt"

import ElectricalServicesIcon
from "@mui/icons-material/ElectricalServices"

import WarningAmberIcon
from "@mui/icons-material/WarningAmber"

import SettingsIcon
from "@mui/icons-material/Settings"

import GitHubIcon
from '@mui/icons-material/GitHub'

import LinkedInIcon
from '@mui/icons-material/LinkedIn'

import InstagramIcon
from '@mui/icons-material/Instagram'

const Home: NextPage = () => {

  const router =
    useRouter()

  const { role } =
    router.query

  return (

    <Layout>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >

        {/* CONTENIDO */}
        <Box sx={{ flex: 1 }}>

          {/* HEADER */}
          <Paper
            elevation={4}
            sx={{
              background: "#263238",
              color: "white",
              padding: "30px",
              textAlign: "center",
              borderRadius: "12px"
            }}
          >

            <BoltIcon
              sx={{
                fontSize: 70,
                color: "#FFC107"
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold"
              }}
            >
              SISTEMA DE
              MONITOREO
              ELÉCTRICO
            </Typography>

            <Typography variant="subtitle1">
              Plataforma IoT
              para monitoreo
              de variables
              eléctricas
            </Typography>

          </Paper>


          {/* BOTONES */}
          <Grid
            container
            spacing={4}
            justifyContent="center"
            sx={{
              marginTop: "30px",
              padding: "20px"
            }}
          >

            {/* DISPOSITIVOS */}
            <Grid
              item
              xs={12}
              md={4}
            >

              <Link
                href={`/dispositivos?role=${role}`}
                style={{
                  textDecoration: "none"
                }}
              >

                <Paper
                  elevation={5}
                  sx={{
                    textAlign: "center",
                    padding: "40px",
                    cursor: "pointer",
                    transition: "0.3s",

                    '&:hover': {
                      backgroundColor: "#eceff1",
                      transform: "translateY(-5px)"
                    }
                  }}
                >

                  <ElectricalServicesIcon
                    sx={{
                      fontSize: 70,
                      color: "#1976d2"
                    }}
                  />

                  <Typography
                    variant="h5"
                    sx={{
                      marginTop: 2
                    }}
                  >
                    DISPOSITIVOS
                  </Typography>

                  <Typography variant="body2">
                    Mediciones, consumos y  alarmas por dispositivo.
                  </Typography>

                </Paper>

              </Link>

            </Grid>


            {/* ALARMAS */}
            <Grid
              item
              xs={12}
              md={4}
            >

              <Link
                href={`/alarmas?role=${role}`}
                style={{
                  textDecoration: "none"
                }}
              >

                <Paper
                  elevation={5}
                  sx={{
                    textAlign: "center",
                    padding: "40px",
                    cursor: "pointer",
                    transition: "0.3s",

                    '&:hover': {
                      backgroundColor: "#fff3e0",
                      transform: "translateY(-5px)"
                    }
                  }}
                >

                  <WarningAmberIcon
                    sx={{
                      fontSize: 70,
                      color: "#f57c00"
                    }}
                  />

                  <Typography
                    variant="h5"
                    sx={{
                      marginTop: 2
                    }}
                  >
                    ALARMAS
                  </Typography>

                  <Typography variant="body2">
                    Visualizacion de
                    alarmas de
                    consumo.
                  </Typography>

                </Paper>

              </Link>

            </Grid>


            {/* CONFIGURACION SOLO ADMIN */}
            {role === "ADMIN" && (

              <Grid
                item
                xs={12}
                md={4}
              >

                <Link
                  href={`/configuracion?role=${role}`}
                  style={{
                    textDecoration: "none"
                  }}
                >

                  <Paper
                    elevation={5}
                    sx={{
                      textAlign: "center",
                      padding: "40px",
                      cursor: "pointer",
                      transition: "0.3s",

                      '&:hover': {
                        backgroundColor: "#eceff1",
                        transform: "translateY(-5px)"
                      }
                    }}
                  >

                    <SettingsIcon
                      sx={{
                        fontSize: 70,
                        color: "#616161"
                      }}
                    />

                    <Typography
                      variant="h5"
                      sx={{
                        marginTop: 2
                      }}
                    >
                      CONFIGURACIÓN
                    </Typography>

                    <Typography variant="body2">
                      Configuración
                      de alarmas y usuarios del sistema.
                    </Typography>

                  </Paper>

                </Link>

              </Grid>
            )}

          </Grid>

        </Box>


        {/* FOOTER */}
        <Paper
          elevation={4}
          sx={{
            background: "#263238",
            color: "white",
            padding: "28px",
            textAlign: "center",
            borderRadius: "12px",
            mt: 4
          }}
        >

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 1
            }}
          >
            SISTEMA IoT DE
            MONITOREO ELÉCTRICO
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: "#CFD8DC"
            }}
          >
            Plataforma para monitoreo
            de variables eléctricas
            en tiempo real
          </Typography>


          {/* REDES */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 3
            }}
          >

            <Button
              variant="contained"
              startIcon={<GitHubIcon />}
              href="https://github.com/"
              target="_blank"
              sx={{
                backgroundColor: "#424242",

                '&:hover': {
                  backgroundColor: "#212121"
                }
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
                backgroundColor: "#1565C0",

                '&:hover': {
                  backgroundColor: "#0D47A1"
                }
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
                backgroundColor: "#AD1457",

                '&:hover': {
                  backgroundColor: "#880E4F"
                }
              }}
            >
              Instagram
            </Button>

          </Box>

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

      </Box>

    </Layout>
  )
}

export default Home