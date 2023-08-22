import {AfterViewInit, Component, Input, OnInit} from '@angular/core';

// declare const mapboxgl:any;

import * as mapboxgl from "mapbox-gl";
import {Point} from "@shared/models/point";

export interface coordinatesPoint {
  id: number,
  latitude: number,//Vĩ độ (latitude): 21.5928 độ Bắc.
  longitude: number,//Kinh độ (longitude): 105.8544 độ Đông.
  title: string,
  urlImage: string,
}
export interface features{
  type: string,//default: "Feature"
  geometry: {
    type: string,//default: 'Point'
    coordinates: [number,number]
  },
  properties: {
    title: string,
    description: string
  }
}
export interface GeoJson {
  kinds:string,//default: "FeatureCollection"
  features: features[]
}
@Component({

  selector: 'ovic-map',
  templateUrl: './ovic-map.component.html',
  styleUrls: ['./ovic-map.component.css']
})
export class OvicMapComponent implements OnInit, AfterViewInit {
  @Input() coordinatesPoint: coordinatesPoint;
  @Input() point: Point;
  token = 'pk.eyJ1IjoidHJhbm1pbmhsb25nIiwiYSI6ImNsazB5eXhodDAxaGszY3BvM2M4cHlkNjEifQ.IPMCYyuOBrIr-CKBFe5R6Q';
  styleMap ='https://api.mapbox.com/styles/v1/tranminhlong/clllro6mw006b01o1533x8i9j.html?title=view&access_token=pk.eyJ1IjoidHJhbm1pbmhsb25nIiwiYSI6ImNsazB5eXhodDAxaGszY3BvM2M4cHlkNjEifQ.IPMCYyuOBrIr-CKBFe5R6Q&zoomwheel=true&fresh=true#12.88/21.59606/105.84638';
  map: any;
  pin: coordinatesPoint[] = [
    {id: 1, latitude: 27, longitude: 23, title: 'Đền đuổm', urlImage: ''},
    {id: 2, latitude: -27, longitude: -23, title: 'vị trí 1', urlImage: ''},
    {id: 3, latitude: -3, longitude: 32, title: 'vi trí 12', urlImage: ''},
    {id: 4, latitude: -27, longitude: -23, title: 'new 111', urlImage: ''}
  ]

  geojson:GeoJson = {
    kinds: "FeatureCollection",
    features: []
  } ;
  ngAfterViewInit(): void {


    // const geojson:geoJson = {
    //   'type': 'FeatureCollection',
    //   'features': [
    //     {
    //       'type': 'Feature',
    //       'geometry': {
    //         'type': 'Point',
    //         'coordinates': [105.74996796080111, 9.878381472650164]
    //       },
    //       'properties': {
    //         'title': 'Mapbox',
    //         'description': 'Washington, D.C.'
    //       }
    //     },
    //     {
    //       'type': 'Feature',
    //       'geometry': {
    //         'type': 'Point',
    //         'coordinates': [105.84443220598332, 28.572295573383016]
    //       },
    //       'properties': {
    //         'title': 'Mapbox',
    //         'description': 'San Francisco, California'
    //       }
    //     }
    //   ]
    // };
    // this.map= new mapboxgl.Map({
    const map = new mapboxgl.Map({
      accessToken: this.token,
      container: 'map', // ID của thẻ HTML để chứa bản đồ
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [105.84443220598332,21.572295573383016],
      zoom: 9
    });
    map.addControl(new mapboxgl.GeolocateControl());
    for (const feature of this.geojson.features) {
      // create a HTML element for each feature
      const el = document.createElement('div');
      el.className = 'marker';
      console.log(el);
      new mapboxgl.Marker(el)
        .setLngLat([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])
        .setPopup(
          new mapboxgl.Popup({offset: 25}) // add popups
            .setHTML(
              `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
            )
        )
        .addTo(map);
    }
  }

  constructor() {
  }

  ngOnInit(): void {
    console.log(this.point)
    if (this.point) {
      this.loadPointMap();
    }
    this.geojson.kinds = 'FeatureCollection';
    if(this.dataPointInMap){
      this.dataPointInMap.forEach(f=>
        this.geojson.features.push(
          {
            type: "Feature",//default: "Feature"
            geometry: {
              type: 'Point',//default: 'Point'
              coordinates: [f['longitude'],f['latitude']]
            },
            properties: {
              title: f.title,
              description: ''
            }
          })
        )
      }
    console.log(this.geojson);
  }

  dataPointInMap: Point[] = [];
  // vido kinhdo => kinhdo(longitude), vido(latitude)
  loadPointMap() {
    console.log(parseInt(' 1231231231'));
    this.dataPointInMap.push(this.point);
    const pointChild = this.point['__child'];

    pointChild.forEach(f => this.dataPointInMap.push(f));

    this.dataPointInMap = this.dataPointInMap.filter(f=>f.toado_map !== null).map(f=>{
      console.log(f.toado_map.split(',')[1]);
      f['longitude'] = parseFloat(f.toado_map.split(',')[1]) ;
      f['latitude'] = parseFloat(f.toado_map.split(',')[0]);
      return f;
    });

    console.log(this.dataPointInMap);

  }

}
