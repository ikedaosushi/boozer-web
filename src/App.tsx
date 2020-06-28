import React, {useState, useRef, useEffect} from 'react';
import { 
  Drawer, Button, Box, Typography, Grid, TextField, Card,
  CardContent
} from '@material-ui/core';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { Rating } from '@material-ui/lab';
import { Search, Add, Remove } from '@material-ui/icons';
import { useForm  } from "react-hook-form";
import { DevTool } from "react-hook-form-devtools";
import mapboxgl from 'mapbox-gl';
const REACT_APP_MAPBOX_KEY = 'pk.eyJ1IjoiaWtlZGFvc3VzaGkiLCJhIjoiY2tiejNmN2d3MG43czJycWUyMHBpa2I0ciJ9.02RcSPuZ_sVc00eq13F-aA';

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

function App() {
  const classes = useStyles();
  const [size, setSize] = useState(2)
  const [stations, setStations] = useState([])
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);

  const { register, handleSubmit, control, errors } = useForm();
  const onSubmit = (data: any) => {
    console.log(data)
    setStations(data)
  }

  useEffect(() => {
    mapboxgl.accessToken = REACT_APP_MAPBOX_KEY;
    const initializeMap = ({ setMap, mapContainer }: any) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
        center: [139.7017112,35.659884],
        zoom: 15
      });

      map.on("load", () => {
        setMap(map);
        map.resize();
      });
      map.on("move", () => {
        // const { lng, lat } = map.getCenter();
      })
    };

    if (!map) initializeMap({ setMap, mapContainer });
  }, [map]);

  return (
    <Box display="flex">
      <DevTool control={control} />
      <Drawer variant="persistent" anchor="left" open={true} className={classes.drawer} classes={{paper: classes.drawerPaper}}>
        <Box textAlign="center" px={6} py={4}>
          <Typography component="h1" variant="h5">複数駅からお店検索</Typography>
          <img src={"./hero.png"} width={200} alt="hero" />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box my={3}><Button type="submit" variant="contained" color="primary" size="large" startIcon={<Search />}>検索</Button></Box>
            {[...Array(size).keys()].map(idx => (
              <Box py={1}><TextField name={`station[${idx}]`} label={`駅名${idx + 1}を入力`} variant="outlined" inputRef={register}/></Box>
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
            {[...Array(10).keys()].map(idx => (
              <Box py={1}><Card variant="outlined"><CardContent>
                <Grid container>
                  <Grid item md={6}>
                    <Typography variant="h6">渋谷駅</Typography>
                    <Box py={1} display="flex" flexDirection="column">
                      <Box py={0.5}><Typography variant="body2">店舗数: 100~</Typography></Box>
                      <Box py={0.5} display="flex" alignItems="center">
                        <Box><Typography variant="body2">上位100件の平均評価:  </Typography></Box>
                        <Rating size="small" value={3.7} readOnly precision={0.1} />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    {[...Array(size).keys()].map(idx => (
                      <Typography variant="body2"> 駅{idx} からの時間: xx分 </Typography>
                    ))}
                  </Grid>
                </Grid>
              </CardContent></Card> </Box>
            ))}
          </Grid>
          <Grid item md={6}>
            <Box px={2}>
              <div ref={el => (mapContainer.current = el)} style={{height: "calc(100vh)"}} />;
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default App;
