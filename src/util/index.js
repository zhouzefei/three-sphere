import * as THREE from "three";
 // 经纬度坐标转换
 export const lglt2xyz = (lg, lt, r) => {

    const phi = (180 + lg) * (Math.PI / 180)
    const theta = (90 - lt) * (Math.PI / 180)

    const x = -r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.cos(theta);
    const z = r * Math.sin(theta) * Math.sin(phi);
    return new THREE.Vector3(x,y,z)
}
