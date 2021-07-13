import * as THREE from "three";
import { lglt2xyz } from "../../util";

export default class Point{
    constructor({radius,pointsData}){
        this.radius = radius;
        this.pointsData = pointsData;
    }
    // 柱状图
    columnar(){
        const { radius, pointsData } = this;
        var group = new THREE.Group();
        const pointGeometry = new THREE.CylinderGeometry(2, 2, parseInt(Math.random()*100), 8);

        for(let [i, d] of pointsData.entries()){
            const pointGeom = pointGeometry.clone();
            var matrix = new THREE.Matrix4();
            matrix.makeRotationX(-Math.PI / 2);
            matrix.setPosition(new THREE.Vector3(0, 0, -10 / 2));
            pointGeom.applyMatrix(matrix);

            let point = new THREE.Mesh(pointGeom, new THREE.MeshBasicMaterial({
                color: d.color,
                transparent: true,
                side: THREE.DoubleSide
            }));

            point.position.copy(lglt2xyz(...d.position, radius))
            point.lookAt(new THREE.Vector3(0,0,0))
            point.name = i
            group.add(point)
        }
        return group;
    }
}
