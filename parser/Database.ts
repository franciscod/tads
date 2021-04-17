import { TAD } from "./Types.ts";

export class TADDatabase {

    private tads: TAD[];

    constructor() {
        this.tads = [];
    }

    getTADByName(name: string): TAD | null {
        return this.tads.find(t => t.nombre.toLowerCase() === name.toLowerCase()) || null;
    }

    registerNewTAD(name: string): TAD | null {
        if(this.getTADByName(name) !== null)
            return null; // el TAD ya está registrado

        const tad: TAD = {
            nombre: name,
            generos: [],
            operaciones: [],
            variablesLibres: []
        };
        this.tads.push(tad);
        
        return tad;
    }
}
