import { Utils } from '../utils/Utils';
import { Material } from './Material';

export class ContactMaterial
{
    /**
     * Identifier of this material
     */
    id: number;

    /**
     * Participating materials
     * @todo  Should be .materialA and .materialB instead
     */
    materials: Material[];

    /**
     * Friction coefficient
     */
    friction: number;

    /**
     * Restitution coefficient
     */
    restitution: number;

    /**
     * Stiffness of the produced contact equations
     */
    contactEquationStiffness: number;

    /**
     * Relaxation time of the produced contact equations
     */
    contactEquationRelaxation: number;

    /**
     * Stiffness of the produced friction equations
     */
    frictionEquationStiffness: number;

    /**
     * Relaxation time of the produced friction equations
     */
    frictionEquationRelaxation: number;

    /**
     * Defines what happens when two materials meet.
     *
     * @param m1
     * @param m2
     * @param options
     */
    constructor(m1?: Material, m2?: Material, options: {
        friction?: number, restitution?: number,
        contactEquationStiffness?: number,
        contactEquationRelaxation?: number,
        frictionEquationStiffness?: number,
        frictionEquationRelaxation?: number
    } = {})
    {
        options = Utils.defaults(options, {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 3
        });

        this.id = ContactMaterial.idCounter++;
        this.materials = [m1, m2];
        this.friction = options.friction;
        this.restitution = options.restitution;
        this.contactEquationStiffness = options.contactEquationStiffness;
        this.contactEquationRelaxation = options.contactEquationRelaxation;
        this.frictionEquationStiffness = options.frictionEquationStiffness;
        this.frictionEquationRelaxation = options.frictionEquationRelaxation;
    }

    static idCounter = 0;
}
