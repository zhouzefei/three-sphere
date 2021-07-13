import * as THREE from "three";
import {TessellateModifier} from "./sources/js/modifiers/TessellateModifier"; // 精细化方案1解决塌陷问题
import {SubdivisionModifier} from "./sources/js/modifiers/SubdivisionModifier"; // 精细化方案2解决塌陷问题
export default class Draw {
    constructor({scene,json, radius}){
        this.lineGroup = new THREE.Group();
        this.shapeGroup = new THREE.Group();
        this.scene = scene || window.scene;
        this.radius = radius;
        this.json_geom = this.createGeometryArray(json);
        this.x_values=[];
        this.y_values=[];
        this.z_values=[];
        this.x_plane_values=[];
        this.y_plane_values=[];
        this.z_plane_values=[];
    }
    init({
        line=false,
        lineOptions={},
        shape=false,
        shapeOptions={}
    }){
        this.lineGroup.name = 'lineGroup';
        this.shapeGroup.name = 'shapeGroup';

        const { options, radius, json_geom } = this;
        let coordinate_array = [];

        // shape属性
        let {materOptions} = shapeOptions || {};
        if(!(materOptions && Object.keys(materOptions).length)){
            materOptions = { color:0x4e3a9f, opacity: 0, transparent:true }
        }
        const material = shapeOptions && shapeOptions.material || new THREE.MeshLambertMaterial(materOptions);
        const shapeGeom = new THREE.Geometry();

        for (let geom_num = 0; geom_num < json_geom.length; geom_num++) {
            const { coordinates=[], type, properties } = json_geom[geom_num] || {};
            if (type=== 'Polygon') {
                for (let segment_num = 0; segment_num < coordinates.length; segment_num++) {
                    coordinate_array = this.createCoordinateArray(coordinates[segment_num]);
                    for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                        if(line){
                            this.convertToCoords(coordinate_array[point_num], radius);
                        }
                        if(shape){
                            this.convertToPlaneCoords(coordinate_array[point_num], radius);
                        }
                    }
                    if(line){
                        const { x_values=[], y_values=[], z_values=[] } = this;
                        this.drawLine(x_values,  y_values, z_values, lineOptions);
                    }
                    if(shape){
                        const { x_plane_values=[], y_plane_values=[], z_plane_values=[] } = this;
                        this.drawShape(x_plane_values, y_plane_values, z_plane_values, shapeOptions, material, properties, radius);
                    }
                }
            } else if (type=== 'MultiPolygon') {
                this.mergeGeo = shapeGeom.clone();
                for (let polygon_num = 0; polygon_num < coordinates.length; polygon_num++) {
                    for (let segment_num = 0; segment_num < coordinates[polygon_num].length; segment_num++) {
                        coordinate_array = this.createCoordinateArray(coordinates[polygon_num][segment_num]);
                        for (let point_num = 0; point_num < coordinate_array.length; point_num++) {
                            if(line){
                                this.convertToCoords(coordinate_array[point_num], radius);
                            }
                            if(shape){
                                this.convertToPlaneCoords(coordinate_array[point_num], radius);
                            }
                        }
                        if(line){
                            const { x_values=[], y_values=[], z_values=[] } = this;
                            this.drawLine(x_values, y_values, z_values, lineOptions);
                        }
                        if(shape){
                            const { x_plane_values=[], y_plane_values=[], z_plane_values=[] } = this;
                            this.drawShape(x_plane_values, y_plane_values, z_plane_values, shapeOptions, material, properties, radius, "multiple")
                        }
                    }
                }
                var pendulum = new THREE.Mesh(this.mergeGeo, material.clone());
                this.shapeGroup.add(pendulum);
           }
        }

        // 线条
        const lineChild = this.lineGroup && this.lineGroup.children && this.lineGroup.children.length;
        if(lineChild){
            this.scene.add(this.lineGroup);
        }
        // 面
        const shapeChild = this.shapeGroup && this.shapeGroup.children && this.shapeGroup.children.length;
        if(shapeChild){
            this.scene.add(this.shapeGroup);
        }
        return {
            lineGroup: this.lineGroup,
            shapeGroup: this.shapeGroup,
        }
    }

    // json处理成数组
    createGeometryArray(json) {
        const { type, features=[], geometries=[] } = json || {};
        const geometry_array = [];
        if (type == 'Feature') {
            geometry_array.push(geometries);
        } else if (type == 'FeatureCollection') {
            for (let feature_num = 0; feature_num < features.length; feature_num++) {
                const item = features[feature_num];
                const geoItem = item.geometry;
                geoItem.properties = item.properties;
                geometry_array.push(geoItem);
            }
        } else if (type == 'GeometryCollection') {
            for (let geom_num = 0; geom_num < geometries.length; geom_num++) {
                geometry_array.push(geometries[geom_num]);
            }
        } else {
            throw new Error('The geoJSON is not valid.');
        }
        return geometry_array;
    }

    // 转换为平面坐标
    convertToPlaneCoords(coordinates_array, radius) {
        var lon = coordinates_array[0];
        var lat = coordinates_array[1];
        this.x_plane_values.push((lon/180) * radius);
        this.y_plane_values.push((lat/180) * radius);
    }

    // 转换坐标
    convertToCoords(coordinates_array, radius) {
        const phi = (180 + coordinates_array[0]) * (Math.PI / 180)
        const theta = (90 - coordinates_array[1]) * (Math.PI / 180)

        const x = -radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        this.x_values.push(x);
        this.y_values.push(y);
        this.z_values.push(z)
    }

    // 绘制线条
    drawLine(x_values, y_values, z_values, options) {
        const geometry = new THREE.Geometry();
        for (let i = 0; i < x_values.length; i++) {
            geometry.vertices.push(new THREE.Vector3(
                x_values[i],
                y_values[i],
                z_values[i]
            ));
        }
        const line_material = new THREE.LineBasicMaterial(options || {
            color: 'white',
            opacity: 0.2,
            transparent: true
        });
        const line = new THREE.Line(geometry, line_material);
        this.lineGroup.add(line);
        this.clearVerArrays();
    }

    // 绘制面
    drawShape(x_values, y_values, z_values, options, material, proper, radius, type) {
        var geometry = this.drawShapeGeo(x_values, y_values, z_values, options);
        if (options.isSubdivision) {
            var tess = new SubdivisionModifier(1);
            tess.modify(geometry);
        } else {
            var tess = new TessellateModifier(3);
            for (var i = 0; i < 12; i++) {
                tess.modify(geometry);
            }
        }
        this.planeToSpr(geometry, proper, radius);

        var mesh = new THREE.Mesh(geometry, material.clone());
        mesh.properties = proper;
        // 多面则合并 针对中国 台湾等掠过效果
        if(type){
            this.mergeGeo.merge(mesh.geometry ,mesh.matrix);
        }else{
            this.shapeGroup.add(mesh)
        }
    }

    drawShapeGeo(x_values, y_values, z_values, options) {
        var shape = new THREE.Shape();
        shape.moveTo(x_values[0], y_values[0]);
        for (var i = 1; i < x_values.length; i++) {
            shape.lineTo(x_values[i], y_values[i]);
        }

        this.clearPlaneArrays();
        return new THREE.ShapeGeometry(shape);
    }

    planeToSpr (geo, proper, radius) {
        var geoVs = geo.vertices;
        // vertices是 这组图形的点集
        // 把这个点集掰弯。
        for (var i = 0; i < geoVs.length; i++) {
            var radius1 = radius;
            var phi = ( geoVs[i].y / radius1 ) * Math.PI; // lat
            var theta = ( - geoVs[i].x / radius1 ) * Math.PI; // lon
            geoVs[i].x = Math.cos( phi ) * Math.cos( theta ) * radius1;
            geoVs[i].z = Math.cos( phi ) * Math.sin( theta ) * radius1;
            geoVs[i].y = Math.sin( phi ) * radius1;
        }
    }

    clearVerArrays() {
        this.x_values = [];
        this.y_values = [];
        this.z_values = [];
    }

    clearPlaneArrays() {
        this.x_plane_values = [];
        this.y_plane_values = [];
        this.z_plane_values = [];
    }

    // 创建坐标矩阵
    createCoordinateArray(xyArr) {
        const feature = xyArr
        let temp_array = [];
        let interpolation_array = [];
        for (let point_num = 0; point_num < feature.length; point_num++) {
            const point1 = feature[point_num];
            const point2 = feature[point_num - 1];
            if (point_num > 0) {
                if (this.needsInterpolation(point2, point1)) {
                    interpolation_array = [point2, point1];
                    interpolation_array = this.interpolatePoints(interpolation_array);

                    for (let inter_point_num = 0; inter_point_num < interpolation_array.length; inter_point_num++) {
                        temp_array.push(interpolation_array[inter_point_num]);
                    }
                } else {
                    temp_array.push(point1);
                }
            } else {
                temp_array.push(point1);
            }
        }
        return temp_array;
    }

    needsInterpolation(point2, point1) {
        const lon1 = point1[0];
        const lat1 = point1[1];
        const lon2 = point2[0];
        const lat2 = point2[1];
        const lon_distance = Math.abs(lon1 - lon2);
        const lat_distance = Math.abs(lat1 - lat2);

        if (lon_distance > 5 || lat_distance > 5) {
            return true;
        } else {
            return false;
        }
    }

    interpolatePoints(interpolation_array) {
        let temp_array = [];
        let point1, point2;

        for (let point_num = 0; point_num < interpolation_array.length-1; point_num++) {
            point1 = interpolation_array[point_num];
            point2 = interpolation_array[point_num + 1];

            if (this.needsInterpolation(point2, point1)) {
                temp_array.push(point1);
                temp_array.push(this.getMidpoint(point1, point2));
            } else {
                temp_array.push(point1);
            }
        }

        temp_array.push(interpolation_array[interpolation_array.length-1]);

        if (temp_array.length > interpolation_array.length) {
            temp_array = this.interpolatePoints(temp_array);
        } else {
            return temp_array;
        }
        return temp_array;
    }

    getMidpoint(point1, point2) {
        const midpoint_lon = (point1[0] + point2[0]) / 2;
        const midpoint_lat = (point1[1] + point2[1]) / 2;
        const midpoint = [midpoint_lon, midpoint_lat];
        return midpoint;
    }
}
