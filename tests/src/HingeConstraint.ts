namespace CANNON
{
    QUnit.module("HingeConstraint", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var bodyA = new Body({ mass: 1, position: new Vector3(1, 0, 0) });
            var bodyB = new Body({ mass: 1, position: new Vector3(-1, 0, 0) });
            var c = new HingeConstraint(bodyA, bodyB, { maxForce: 123 });

            test.equal(c.equations.length, 6); // 5 actually, and 1 for the motor

            test.equal(c.equations[0].maxForce, 123);
            test.equal(c.equations[1].maxForce, 123);
            test.equal(c.equations[2].maxForce, 123);
            test.equal(c.equations[3].maxForce, 123);
            test.equal(c.equations[4].maxForce, 123);
            test.equal(c.equations[5].maxForce, 123);

            test.equal(c.equations[0].minForce, -123);
            test.equal(c.equations[1].minForce, -123);
            test.equal(c.equations[2].minForce, -123);
            test.equal(c.equations[3].minForce, -123);
            test.equal(c.equations[4].minForce, -123);
            test.equal(c.equations[5].minForce, -123);

        });

        QUnit.test("update", (test) =>
        {
            var bodyA = new Body({ mass: 1, position: new Vector3(1, 0, 0) });
            var bodyB = new Body({ mass: 1, position: new Vector3(-1, 0, 0) });
            var c = new HingeConstraint(bodyA, bodyB, { maxForce: 123 });

            c.update();
            test.ok(true);
        });

        QUnit.test("enableDisableMotor", (test) =>
        {
            var bodyA = new Body({ mass: 1, position: new Vector3(1, 0, 0) });
            var bodyB = new Body({ mass: 1, position: new Vector3(-1, 0, 0) });
            var c = new HingeConstraint(bodyA, bodyB);

            c.enableMotor();

            test.ok(c.motorEquation.enabled);

            c.disableMotor();

            test.equal(c.motorEquation.enabled, false);

        });

        QUnit.test("setMotorSpeed", (test) =>
        {
            var bodyA = new Body({ mass: 1, position: new Vector3(1, 0, 0) });
            var bodyB = new Body({ mass: 1, position: new Vector3(-1, 0, 0) });
            var c = new HingeConstraint(bodyA, bodyB);

            c.setMotorSpeed(5);
            test.equal(c.motorEquation.targetVelocity, 5);

        });

        QUnit.test("setMotorMaxForce", (test) =>
        {
            var bodyA = new Body({ mass: 1, position: new Vector3(1, 0, 0) });
            var bodyB = new Body({ mass: 1, position: new Vector3(-1, 0, 0) });
            var c = new HingeConstraint(bodyA, bodyB);

            c.setMotorMaxForce(100);
            test.equal(c.motorEquation.maxForce, 100);

        });
    });
}
