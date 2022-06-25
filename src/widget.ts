// Copyright (c) David Brochart
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import * as bertin from 'bertin';
import * as d3_geo from 'd3-geo';
import * as d3_geo_projection from 'd3-geo-projection';

import { MODULE_NAME, MODULE_VERSION } from './version';

export class MapModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: MapModel.model_name,
      _model_module: MapModel.model_module,
      _model_module_version: MapModel.model_module_version,
      _view_name: MapModel.view_name,
      _view_module: MapModel.view_module,
      _view_module_version: MapModel.view_module_version,
      options: {},
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'MapModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'MapView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class MapView extends DOMWidgetView {
  render() {
    d3_geo;
    d3_geo_projection;
    this.map = null;
    this.options_changed();
    this.model.on('change:options', this.options_changed, this);
  }

  options_changed() {
    const options = this.model.get('options');
    const pyParams = options.params;
    let params: {[k: string]: any} = {};
    for (const p in pyParams) {
      if (p === 'projection') {
        let code = pyParams[p];
        let i = code.indexOf('.');
        let lib = code.slice(0, i);
        lib = lib.replaceAll('-', '_');
        code = lib.concat(code.slice(i));
        params[p] = eval(code);
      }
      else if (p === 'extent') {
        params[p] = JSON.parse(pyParams[p]);
      }
      else {
        params[p] = pyParams[p];
      }
    }
    const pyLayers = options.layers;
    let layers = [];
    for (const l of pyLayers) {
      let layer: {[k: string]: any} = {};
      for (const p in l) {
        if (p === 'geojson') {
          const s = l[p].trim();
          if (s.startsWith('{')) {
            layer[p] = JSON.parse(s);
          }
          else {
            layer[p] = eval(s);
          }
        }
        else {
          layer[p] = l[p];
        }
      }
      layers.push(layer);
    }
    if (this.map !== null) {
      this.el.removeChild(this.map);
    }
    this.map = this.el.appendChild(
      bertin.draw({
        params,
        layers,
      })
    );
  }

  map: any;
}
