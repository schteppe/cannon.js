namespace CANNON
{
    QUnit.module("ContactEquation", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var bodyA = new Body();
            var bodyB = new Body();
            new ContactEquation(bodyA, bodyB);
            test.ok(true);
        });

        QUnit.test("getImpactVelocityAlongNormal", (test) =>
        {
            var bodyA = new Body({
                position: new Vector3(1, 0, 0),
                velocity: new Vector3(-10, 0, 0)
            });
            var bodyB = new Body({
                position: new Vector3(-1, 0, 0),
                velocity: new Vector3(1, 0, 0)
            });
            var contact = new ContactEquation(bodyA, bodyB);
            contact.ni.set(1, 0, 0);
            contact.ri.set(-1, 0, 0);
            contact.rj.set(1, 0, 0);
            var v = contact.getImpactVelocityAlongNormal();
            test.equal(v, -11);
        });
    });
}