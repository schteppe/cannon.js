namespace CANNON
{
    QUnit.module("Constraint", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var bodyA = new Body();
            var bodyB = new Body();
            new Constraint(bodyA, bodyB);
            test.ok(true);
        });

        QUnit.test("enable", (test) =>
        {
            var bodyA = new Body();
            var bodyB = new Body();
            var c = new Constraint(bodyA, bodyB);
            var eq = new Equation(bodyA, bodyB);
            c.equations.push(eq);

            c.enable();
            test.ok(eq.enabled);

            c.disable();
            test.ok(!eq.enabled);

        });
    });
}

