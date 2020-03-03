/**
 * Constraint equation solver base class.
 * @class Solver
 * @constructor
 * @author schteppe / https://github.com/schteppe
 */
export class Solver {
  constructor() {
    super()
    
    /**
     * All equations to be solved
     * @property {Array} equations
     */
    this.equations = []
  }

  /**
   * Should be implemented in subclasses!
   * @method solve
   * @param  {Number} dt
   * @param  {World} world
   */
  solve(dt, world) {
    return (
      // Should return the number of iterations done!
      0
    )
  }

  /**
   * Add an equation
   * @method addEquation
   * @param {Equation} eq
   */
  addEquation(eq) {
    if (eq.enabled) {
      this.equations.push(eq)
    }
  }

  /**
   * Remove an equation
   * @method removeEquation
   * @param {Equation} eq
   */
  removeEquation(eq) {
    const eqs = this.equations
    const i = eqs.indexOf(eq)
    if (i !== -1) {
      eqs.splice(i, 1)
    }
  }

  /**
   * Add all equations
   * @method removeAllEquations
   */
  removeAllEquations() {
    this.equations.length = 0
  }
}
