import React, {useState, useCallback, useEffect} from 'react';
import {
  Drawer, Button, Box, Typography, Grid, TextField, Card,
  CardContent, Dialog, DialogTitle 
} from '@material-ui/core';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { Rating, Autocomplete } from '@material-ui/lab';
import { createFilterOptions } from '@material-ui/lab/Autocomplete';
import { Search, Add, Remove, Place } from '@material-ui/icons';
import { useForm  } from "react-hook-form";
// import { DevTool } from "react-hook-form-devtools";
import ReactMapGL, {Marker} from 'react-map-gl';
const MAPBOX_KEY = 'pk.eyJ1IjoiaWtlZGFvc3VzaGkiLCJhIjoiY2tiejNmN2d3MG43czJycWUyMHBpa2I0ciJ9.02RcSPuZ_sVc00eq13F-aA';
const API_URL_BASE = "http://127.0.0.1:8000"

const drawerWidth = 320;
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      width: drawerWidth,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerContainer: {
      overflow: 'auto',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    mapContainer: {
      height: "calc(100vh - 80px)",
    }
  }),
);


interface Viewport {
  longitude: number,
  latitude: number,
  zoom?: number
}

interface StationMaster {
  station_id: number,
  station_name: string,
  lon: number,
  lat: number,
}


interface CandidateStation {
  station_id: number,
  station_name: string,
  lon: number,
  lat: number,
  num_shop: number,
  top10_avarage_score: number
}

interface StationTime {
  station_id: number,
  station_name: string,
  time: 9
}

interface ElectionResult {
  candidate_station: CandidateStation,
  indicater: number,
  station_times: Array<StationTime>
}

interface Marker {
    latitude: number,
    longitude: number,
}

const defaultViewport: Viewport = {
    latitude: 35.659884,
    longitude: 139.7017112,
    zoom: 15 
}

export interface SubmitDialogProps {
  open: boolean,
  onClose: () => void
}

function SubmitDialog(props: SubmitDialogProps) {
  const { open, onClose } = props;
  return (
    <Dialog onClose={onClose}  aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">駅を2つ選んでください</DialogTitle>
    </Dialog>
  );
}

function App() {
  const classes = useStyles();
  const [masterStations, setMasterStations] = useState<Array<StationMaster>>([])
  const [depStations, setDepStations] = useState<Array<StationMaster>>([])
  const [candStations, setCandStations] = useState<Array<ElectionResult>>([])
  const [size, setSize] = useState<number>(2)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [viewport, setViewpoirt] = useState<Viewport>(defaultViewport)

  const { register, handleSubmit } = useForm();

  const getCandidateStations = async () => {
    // station_id=22828&station_id=22715
    let url  = new URL(API_URL_BASE + "/api/v1/election")
    const params = [['station_id', "22828"], ['station_id', "22715"]]
    url.search = new URLSearchParams(params).toString();
    const res = await fetch(url.toString())
    const data = await res.json()
    console.log(data)
    setCandStations(data.results)
  };

  const onSubmit = (data) => {
    // const submitStations: Array<string> = data.station
    // const stations = submitStations.flatMap(
    //   stationName => stationMaster.find(master => master.station_name === stationName))
    // setDepStations(stations)
    setDialogOpen(true)
    getCandidateStations()
  }

  const handleClose = () => {
    setDialogOpen(false);
  };


  const getStationMaster = useCallback( async () => {
    const res = await fetch(API_URL_BASE + "/api/v1/stations")
    const data = await res.json()
    setMasterStations(data["results"])
  }, [])

  useEffect(() => {
    getStationMaster()
  }, [getStationMaster])

  useEffect(() => {
    const n = depStations.length
    if(n < 1) return
    const newViewport = {
      latitude: depStations.reduce((total, current) => total + current.lat, 0) / n,
      longitude: depStations.reduce((total, current) => total + current.lon, 0) / n,
      zoom: 12 
    }
    setViewpoirt(newViewport)
  }, [depStations])

  return (
    <Box display="flex">
      <SubmitDialog onClose={handleClose} open={dialogOpen} ></SubmitDialog>
      {/* <DevTool control={control} /> */}
      <Drawer variant="persistent" anchor="left" open={true} className={classes.drawer} classes={{paper: classes.drawerPaper}}>
        <Box textAlign="center" px={6} py={4}>
          <Typography component="h1" variant="h5">複数駅からお店検索</Typography>
          <img src={"./hero.png"} width={200} alt="hero" />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box my={3}><Button type="submit" variant="contained" color="primary" size="large" startIcon={<Search />}>検索</Button></Box>

            {[...Array(size).keys()].map(idx => (
              <Box key={idx} py={1}>
                <Autocomplete
                  options={masterStations}
                  freeSolo
                  autoComplete
                  autoSelect
                  blurOnSelect
                  disableListWrap
                  filterOptions={createFilterOptions({limit: 5})}
                  getOptionLabel={(station) => station.station_name}
                  renderInput={(params) => (
                    <TextField name={`station[${idx}]`} {...params} label={`駅名${idx + 1}を入力`} variant="outlined" inputRef={register}/>
                  )}
                />
              </Box>
            ))}
            <Button onClick={() => setSize(size+1)} color="secondary" startIcon={<Add />}>増やす</Button>
            {(size > 2) && (
              <Button onClick={() => setSize(size-1)} color="secondary" startIcon={<Remove />}>減らす</Button>
            )}
          </form>
        </Box>
      </Drawer>
      <Box py={3} px={2} flexGrow={1}>
        <Grid container>
          <Grid item md={6}>
          <Box textAlign="center"> <Typography variant="h5" component="h1"> 検索結果 </Typography> </Box>
          {(candStations.length === 0) &&  (
            <Box textAlign="center" py={3}><Typography variant="h6">駅を入力して検索してください</Typography></Box>
          )}
          {(candStations.length > 0) && candStations.map(station => 
              (<Box py={1} key={station.candidate_station.station_id}>
                <Card variant="outlined">
                  <CardContent>
                  <Grid container>
                    <Grid item md={6}>
                      <Typography variant="h6">{station.candidate_station.station_name}</Typography>
                      <Box py={1} display="flex" flexDirection="column">
                      <Box py={0.5}><Typography variant="body2">店舗数: {station.candidate_station.num_shop}</Typography></Box>
                        <Box py={0.5} display="flex" alignItems="center">
                          <Box><Typography variant="body2">上位10件の平均評価: {station.candidate_station.top10_avarage_score.toFixed(2)}</Typography></Box>
                          {/* <Rating size="small" value={station.candidate_station.top10_avarage_score} readOnly precision={0.01} /> */}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item md={6}>
                      {station.station_times.map(stationTime => (
                        <Box key={stationTime.station_id} py={1}>
                          <Typography variant="body2"> {stationTime.station_name} からの時間: {stationTime.time}分 </Typography>
                        </Box>
                      ))}
                    </Grid>
                  </Grid>
                </CardContent>
                </Card>
              </Box>)
           ) } 
          {/* {[...Array(5).keys()].map(idx => (
              <Box key={idx} py={1}><Card variant="outlined">
                <CardContent>
                <Grid container>
                  <Grid item md={6}>
                    <Typography variant="h6">渋谷駅</Typography>
                    <Box py={1} display="flex" flexDirection="column">
                      <Box py={0.5}><Typography variant="body2">店舗数: 100~</Typography></Box>
                      <Box py={0.5} display="flex" alignItems="center">
                        <Box><Typography variant="body2">上位10件の平均評価:  </Typography></Box>
                        <Rating size="small" value={3.7} readOnly precision={0.1} />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    {[...Array(size).keys()].map(idx => (
                      <Typography key={idx} variant="body2"> 駅{idx} からの時間: xx分 </Typography>
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
              </Card> 
              </Box>
            ))} */ }
          </Grid>
          <Grid item md={6}>
            <Box px={2}>
              {/* <ReactMapGL 
                width="100%"
                height="100vh"
                {...viewport}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxApiAccessToken={MAPBOX_KEY}
              >
                {stations.map(station=> (
                  <Marker key={station.station_id} longitude={station.lon} latitude={station.lat}> <Place fontSize="large" color="secondary" /></Marker>))}
              </ReactMapGL> */}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default App;
