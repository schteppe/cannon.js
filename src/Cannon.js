// Export classes
module.exports = {
    ArrayCollisionMatrix :          require('./collision/ArrayCollisionMatrix'),
    Broadphase :                    require('./collision/Broadphase'),
    GridBroadphase :                require('./collision/GridBroadphase'),
    NaiveBroadphase :               require('./collision/NaiveBroadphase'),
    ObjectCollisionMatrix :         require('./collision/ObjectCollisionMatrix'),
    Ray :                           require('./collision/Ray'),

    Constraint :                    require('./constraints/Constraint'),
    ContactEquation :               require('./constraints/ContactEquation'),
    DistanceConstraint :            require('./constraints/DistanceConstraint'),
    Equation :                      require('./constraints/Equation'),
    FrictionEquation :              require('./constraints/FrictionEquation'),
    HingeConstraint :               require('./constraints/HingeConstraint'),
    PointToPointConstraint :        require('./constraints/PointToPointConstraint'),
    RotationalEquation :            require('./constraints/RotationalEquation'),
    RotationalMotorEquation :       require('./constraints/RotationalMotorEquation'),

    ContactMaterial :               require('./material/ContactMaterial'),
    Material :                      require('./material/Material'),

    Mat3 :                          require('./math/Mat3'),
    Quaternion :                    require('./math/Quaternion'),
    MatN :                          require('./math/MatN'),
    Vec3 :                          require('./math/Vec3'),

    Body :                          require('./objects/Body'),
    Box :                           require('./objects/Box'),
    Compound :                      require('./objects/Compound'),
    ConvexPolyhedron :              require('./objects/ConvexPolyhedron'),
    Cylinder :                      require('./objects/Cylinder'),
    Particle :                      require('./objects/Particle'),
    Plane :                         require('./objects/Plane'),
    RigidBody :                     require('./objects/RigidBody'),
    Shape :                         require('./objects/Shape'),
    Sphere :                        require('./objects/Sphere'),
    SPHSystem :                     require('./objects/SPHSystem'),

    GSSolver :                      require('./solver/GSSolver'),
    Solver :                        require('./solver/Solver'),
    SplitSolver :                   require('./solver/SplitSolver'),

    EventTarget :                   require('./utils/EventTarget'),
    ObjectPool :                    require('./utils/Pool'),
    Vec3Pool :                      require('./utils/Vec3Pool'),

    ContactGenerator :              require('./world/ContactGenerator'),
    World :                         require('./world/World'),

    version :                       require('../package.json').version,
};
