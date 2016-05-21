'use strict'

var inductive = module.exports = {}
  , fsPath = require('path')
  , fs = require('fs')
  , tap = require('./tap.js')
  , util = require('./util.js')
  , apiMethods = require('./apiMethods.js')
  , DeferredApiCall = require('./DeferredApiCall.js')
  , Requirement = require('./Requirement.js')
  , AstNode = require('./specs/AstNode.js')
  , FileContents = require('./FileContents.js')
  , fileContext = require('./fileContext.js')
  , globalOptions = require('./globalOptions.js')
  , clock = require('./specs/clock.js')
  , verbosityLevels = require('./verbosityLevels.js')
  , Type = require('./types/Type.js')
  , UniqueType = require('./types/UniqueType.js')
  , NativeConstructor = require('./NativeConstructor.js').NativeConstructor
  , objectConstructor = require('./NativeConstructor.js').objectConstructor
  , arrayConstructor = require('./NativeConstructor.js').arrayConstructor
  , typeUtil = require('./types/typeUtil.js')
  , ProtoMember = require('./specs/ProtoMember.js')
  , RecordProperty = require('./types/RecordProperty.js')
  , RecordType = require('./types/RecordType.js')
  , SmallType = require('./types/SmallType.js')
  , Expression = require('./expressions/Expression.js')
  , FunctionType = require('./types/FunctionType.js')
  , nativeTypes = require('./types/nativeTypes.js')
  , ArgumentsTupleType = require('./types/ArgumentsTupleType.js')
  , UnionType = require('./types/UnionType.js')
  , TypeParameter = require('./types/TypeParameter.js')
  , ParameterizedType = require('./types/ParameterizedType.js')
  , ArrayType = require('./types/ArrayType.js')
  , MapType = require('./types/MapType.js')
  , Specification = require('./specs/Specification.js')
  , MatchSpecification = require('./specs/MatchSpecification.js')
  , ExpressionArgument = require('./expressions/ExpressionArgument.js')
  , ValueExpression = require('./expressions/ValueExpression.js')
  , IsolateExpression = require('./expressions/IsolateExpression.js')
  , MatchExpression = require('./expressions/MatchExpression.js')
  , RefinementExpression = require('./expressions/RefinementExpression.js')
  , FunctionExpression = require('./expressions/FunctionExpression.js')
  , CallExpression = require('./expressions/CallExpression.js')
  , MemberCallExpression = require('./expressions/MemberCallExpression.js')
  , MemberExpression = require('./expressions/MemberExpression.js')
  , Assignment = require('./specs/Assignment.js')
  , TestResults = require('./specs/TestResults.js')
  , Execution = require('./specs/Execution.js')
  , Expectation = require('./specs/Expectation.js')
  , Mock = require('./specs/Mock.js')
  , BuildingBlockUsage = require('./specs/BuildingBlockUsage.js')
  , Scenario = require('./specs/Scenario.js')
  , AssignmentMock = require('./specs/AssignmentMock.js')
  , EachMock = require('./specs/EachMock.js')
  , EachAssignmentMock = require('./specs/EachAssignmentMock.js')
  , Solver = require('./specs/Solver.js')
  , traversalUtil = require('./specs/traversalUtil.js')

var RecursiveCallExpression = require(
  './expressions/RecursiveCallExpression.js')

var MemberUpdateExpression = require(
  './expressions/MemberUpdateExpression.js')

var ObjectCreateExpression = require(
  './expressions/ObjectCreateExpression.js')

var AssignedVariableExpression = require(
  './expressions/AssignedVariableExpression.js')

var SpecificationCallExpression = require(
  './expressions/SpecificationCallExpression.js')

var ConstructorExpression = require(
    './expressions/ConstructorExpression.js')

var MatchArgumentExpression = require(
  './expressions/MatchArgumentExpression.js')

var ConstructorSpecification = require(
  './specs/ConstructorSpecification.js')

var AmbiguousBuildingBlockUsage = require(
  './AmbiguousBuildingBlockUsage.js')

Object.defineProperty(inductive, 'model', {
  value: {
    Type: Type,
    SmallType: SmallType,
    FunctionType: FunctionType,
    RecordType: RecordType,
    RecordProperty: RecordProperty,
    ArgumentsTupleType: ArgumentsTupleType,
    UnionType: UnionType,
    ArrayType: ArrayType,
    MapType: MapType,
    ParameterizedType: ParameterizedType,
    TypeParameter: TypeParameter,
    ConstructorSpecification: ConstructorSpecification,
    MatchSpecification: MatchSpecification,
    NativeConstructor: NativeConstructor,
    Expression: Expression,
    ExpressionArgument: ExpressionArgument,
    ValueExpression: ValueExpression,
    IsolateExpression: IsolateExpression,
    MatchExpression: MatchExpression,
    MatchArgumentExpression: MatchArgumentExpression,
    FunctionExpression: FunctionExpression,
    ConstructorExpression: ConstructorExpression,
    CallExpression: CallExpression,
    SpecificationCallExpression: SpecificationCallExpression,
    AssignedVariableExpression: AssignedVariableExpression,
    MemberCallExpression: MemberCallExpression,
    MemberExpression: MemberExpression,
    RefinementExpression: RefinementExpression,
    RecursiveCallExpression: RecursiveCallExpression,
    ObjectCreateExpression: ObjectCreateExpression,
    MemberUpdateExpression: MemberUpdateExpression,
    EachMock: EachMock,
    Scenario: Scenario,
    Expectation: Expectation,
    AssignmentMock: AssignmentMock,
    Mock: Mock,
    BuildingBlockUsage: BuildingBlockUsage,
    TestResults: TestResults,
    ProtoMember: ProtoMember,
    Assignment: Assignment,
    Execution: Execution,
    Solver: Solver,
    Clock: clock.constructor,
    DeferredApiCall: DeferredApiCall,
    AstNode: AstNode,
    Requirement: Requirement,
    FileContents: FileContents,
    AmbiguousBuildingBlockUsage: AmbiguousBuildingBlockUsage,
    UniqueType: UniqueType,
    verbosityLevels: verbosityLevels
  }
})

Object.defineProperty(inductive, 'globals', {
  value: function() {
    if(global.inductive === inductive) return
    ;['inductive'].concat(Object.keys(inductive)).forEach(function(key) {
      if(key in global)
        throw new Error(key + ' already specified in global object')
      global[key] = inductive[key]
    })
    global.inductive = inductive
    return inductive
  }
})

Object.defineProperty(inductive, 'tap', { value: tap })

Object.defineProperty(inductive, 'fileOptions', {
  enumerable: true,
  get: function() {
    return fileContext.getFileOptions()
  }
})

inductive.objectConstructor = objectConstructor
inductive.arrayConstructor = arrayConstructor

Object.keys(nativeTypes).forEach(function(key) {
  inductive[key] = nativeTypes[key]
})

inductive.verbosityLevels = verbosityLevels
inductive.globalOptions = globalOptions
inductive.clock = clock
inductive.asArguments = typeUtil.asArguments

apiMethods.forEach(function(name) {
  if(name in inductive) throw new Error('Duplicate name: ' + name)
  inductive[name] = function() {
    var apiCallArgs = util.arrayOfType(
      [].slice.apply(arguments),
      DeferredApiCall)
    return new DeferredApiCall([name], arguments)
  }
})

Object.keys(util.comparands).concat(['~=']).forEach(function(sign) {
  ;['shouldReturn', 'shouldNotReturn'].forEach(function(shouldFn) {
    if(sign in inductive[shouldFn])
      throw new Error('Duplicate sign ' + sign + ' in ' + shouldFn)
    inductive[shouldFn][sign] = function() {
      var apiCallArgs = util.arrayOfType(
        [].slice.apply(arguments),
        DeferredApiCall)
      if(apiCallArgs.length)
        throw new Error('Cannot call ' + apiCallArgs[0].path[0] +
          ' in "' + shouldFn + '[' + sign + ']"')
      return new DeferredApiCall([shouldFn, sign], arguments)
    }
  })
})

inductive.functionType = function() {
  return DeferredApiCall.callChildren(arguments, function() {
    var args = arguments
    if(args.length > 1 || (args.length && typeof args[0] !== 'string')) {
      tap.comment(args)
      throw new Error('Invalid args passed to functionType')
    }
    var fnType = Object.create(FunctionType.prototype)
    FunctionType.apply(fnType, [].map.call(args, function(a) {
      return typeof a === 'string' ? a : typeUtil.resolveType(a)
    }))
    return fnType
  })
}

inductive.typeParameter = function(name) {
  return new TypeParameter(name)
}

inductive.smallType = function(name, wrappedType) {
  return new SmallType(name, typeUtil.resolveType(wrappedType))
}

inductive.nativeConstructor = function(fn, base, factoryFn) {
  return new NativeConstructor(fn, base, factoryFn)
}

inductive.protoMember = function(ctor, spec, name) {
  return new ProtoMember(ctor, spec, name)
}

inductive.run = function(spec) {
  return new Execution(spec)
}

inductive.assign = function() {
  var assignment = Object.create(Assignment.prototype)
  Assignment.apply(assignment, arguments)
  return assignment
}

inductive.type = function type(name) {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new Type(name || '')
  })
}

inductive.parameterizedType = function() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    var args = [].slice.apply(arguments)
      , isCtor = args[args.length - 1] && args[args.length - 1].isConstructor
    return isCtor ?
      new ParameterizedType(
        args.slice(0, args.length - 2).map(function(a) {
          return typeUtil.resolveType(a)
        }),
        args[args.length - 2],
        args[args.length - 1]) :
      new ParameterizedType(
        args.slice(0, args.length - 1).map(function(a) {
          return typeUtil.resolveType(a)
        }),
        args[args.length - 1])
  })
}

inductive.argumentsTupleType = function() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new ArgumentsTupleType(
      [].map.call(arguments, function(t) {
        return typeUtil.resolveType(t)
      }))
  })
}

inductive.recordType = function(ctor) {
  return DeferredApiCall.callChildren(arguments, function(ctor) {
    return new RecordType(ctor)
  })
}

inductive.uniqueType = function() {
  return new UniqueType()
}

inductive.unionType = function() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new UnionType([].map.call(arguments, function(a) {
      return typeUtil.resolveType(a)
    }))
  })
}

inductive.express = function(name) {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new Expression(name || '')
  })
}

inductive.expressValue = function(name) {
  return new ValueExpression(name)
}

inductive.isolate = function(name) {
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new IsolateExpression(name)
  })
}

function solveSpecification(name, args, factory) {
  var spec
  try {
    spec = DeferredApiCall.callChildren(args, function() {
      if(arguments.length !== 1) {
        tap.comment('Invalid parameters:')
        ;[].slice.call(arguments, 1).forEach(function(arg) {
          tap.comment('  ', arg)
        })
        throw new Error('Invalid parameters passed to ' + name)
      }
      return factory.apply(this, arguments)
    })
    var cachedAst = fileContext.getCachedSolutionAst(name)
      , contents = fileContext.getFileContents()
    if(!fileContext.getFileOptions().shouldRunTest(name)) {
      // Handle cache when the test is skipped
      contents.blocks.push('// Skipped ' + name)
      fileContext.cacheNewSolutionAst(name, cachedAst)
      return spec
    }
    if(cachedAst) {
      // Attempt solve with the cache
      spec.solve(cachedAst)
      if(spec.solution) {
        inductive.tap.log(
          true, name, ':', spec.getType() + ' solution (cached)')
        spec.logSuccess(true)
        return spec
      } else {
        inductive.tap.comment(name,
          'cached solution failed with status', spec.status)
      }
    }

    // Attempt a normal solve
    var start = +(new Date())
    spec.solve()
    var end = +(new Date())
      , elapsed = Math.round(end - start) / 1000

    if(spec.solution) {
      inductive.tap.log(
        true, name, ':', spec.getType() + ' solution', elapsed + 's')
      spec.logSuccess()
    } else {
      contents.blocks.push('// Failed ' + name)
      inductive.tap.log(
        false, name, ':', spec.getType(), spec.status)
      spec.logFailure()
      if(spec.options.stopOnFailure) {
        inductive.tap.comment('Stopping on failure')
        process.exit()
      }
    }
    return spec
  } catch(err) {
    inductive.tap.comment(name, util.tryGetCallingFile() || '', err.message)
    throw err
  }
}

inductive.specify = function(name) {
  return solveSpecification(name, arguments, function() {
    return new Specification(name || '')
  })
}

inductive.specifyConstructor = function(name) {
  return solveSpecification(name, arguments, function() {
    return new ConstructorSpecification(name || '')
  })
}

inductive.specifyMatch = function(name) {
  var args = [].slice.call(arguments)
    , childSpecs = util.arrayOfType(args, Specification)
    , rest = util.arrayNotOfType(args, Specification)
  return solveSpecification(name, rest, function() {
    var matchSpec = new MatchSpecification(name || '', childSpecs)
    return matchSpec
  })
}

inductive.saveAll = function(cont) {
  cont = cont || function() {}
  var files = fileContext.getFiles()
  ;(function tick(err) {
    if(err) return cont(err)
    if(!files.length) return fileContext.saveCache(cont)

    var f = files.shift()
      , contents = fileContext.getFileContents(f)

    // Calls to require():
    var requirements = util.unique(contents.requirements.map(function(r) {
      var path = r.objectPath ? '.' + r.objectPath : ''
        , filename = r.isRelative ? r.filename : r.name
      if(r.isRelative) {
        var sourceDir = fsPath.dirname(f)
          , otherDir = fsPath.dirname(filename)
          , relativeDir = fsPath.relative(sourceDir, otherDir)
          , otherBase = fsPath.basename(filename)
        filename = ['.', relativeDir, otherBase].
          filter(util.identity).
          join(fsPath.sep)
      }
      return 'var ' + r.alias + ' = require(' +
        JSON.stringify(filename) + ')' + path + ';'
    }))

    // module.exports:
    var exportsBlock = []
      , exports = util.getExports(require(contents.sourceFile))
    if(exports.length === 1 && !exports[0].path)
      exportsBlock.push('module.exports = ' + exports[0].value.name)
    else if(exports.length) {
      exports.forEach(function(p) {
        var path = p.path
        for(var i = 1; i < path.length; i++)
          exportsBlock.push('exports.' +
            path.slice(0, i).join('.') + ' = {}')
        exportsBlock.push('exports.' + path.join('.') +
          ' = ' + p.value.name)
      })
      exportsBlock = util.unique(exportsBlock)
    }

    var code =
      [requirements.join('\n')].
      concat(contents.blocks).
      concat(exportsBlock.join('\n')).
      filter(util.identity).
      map(function(block) {
        return util.prettify(block, globalOptions.escodegen)
      }).
      join('\n\n')

    tap.comment('Writing', f)
    fs.writeFile(f, code, tick)
  })()
}

Object.defineProperty(inductive, 'buildingBlocks', {
  value: require('./buildingBlocks.js')
})

