'use strict'

var inductive = module.exports = {}
  , fsPath = require('path')
  , fs = require('fs')
  , tap = require('./tap.js')
  , util = require('./util.js')
  , DeferredApiCall = require('./DeferredApiCall.js')
  , Requirement = require('./Requirement.js')
  , AstNode = require('./specs/AstNode.js')
  , FileContents = require('./FileContents.js')
  , fileContext = require('./fileContext.js')
  , globalOptions = require('./globalOptions.js')
  , clock = require('./specs/Clock.js')
  , verbosityLevels = require('./verbosityLevels.js')
  , Type = require('./types/Type.js')
  , UniqueType = require('./types/UniqueType.js')
  , NativeConstructor = require('./NativeConstructor.js').NativeConstructor
  , objectConstructor = require('./NativeConstructor.js').objectConstructor
  , arrayConstructor = require('./NativeConstructor.js').arrayConstructor
  , typeUtil = require('./types/typeUtil.js')
  , typePlaceholder = require('./types/typePlaceholder.js')
  , ProtoMember = require('./specs/ProtoMember.js')
  , RecordProperty = require('./types/RecordProperty.js')
  , RecordType = require('./types/RecordType.js')
  , SmallType = require('./types/SmallType.js')
  , Expression = require('./expressions/Expression.js')
  , FunctionType = require('./types/FunctionType.js')
  , nativeTypes = require('./types/nativeTypes.js')
  , ArgumentsType = require('./types/ArgumentsType.js')
  , UnionType = require('./types/UnionType.js')
  , TypeParameter = require('./types/TypeParameter.js')
  , ParameterizedType = require('./types/ParameterizedType.js')
  , Specification = require('./specs/Specification.js')
  , ExpressionArgument = require('./expressions/ExpressionArgument.js')
  , ValueExpression = require('./expressions/ValueExpression.js')
  , IsolateExpression = require('./expressions/IsolateExpression.js')
  , MatchExpression = require('./expressions/MatchExpression.js')
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
    typePlaceholder: typePlaceholder,
    RecordType: RecordType,
    RecordProperty: RecordProperty,
    ArgumentsType: ArgumentsType,
    UnionType: UnionType,
    ParameterizedType: ParameterizedType,
    TypeParameter: TypeParameter,
    ConstructorSpecification: ConstructorSpecification,
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
    RecursiveCallExpression: RecursiveCallExpression,
    ObjectCreateExpression: ObjectCreateExpression,
    MemberUpdateExpression: MemberUpdateExpression,
    Specification: Specification,
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
    UniqueType: UniqueType
  }
})

Object.defineProperty(inductive, 'globals', {
  value: function() {
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

inductive.globalOptions = globalOptions
inductive.clock = clock
inductive.asMap = typeUtil.asMap
inductive.asFunctionOfType = typeUtil.asFunctionOfType

var apiMethods = ['accumulator',
  'after',
  'afterAll',
  'afterEach',
  'as',
  'before',
  'beforeAll',
  'beforeEach',
  'binds',
  'call',
  'callback',
  'calls',
  'constrainChild',
  'constrainParent',
  'defaultMock',
  'defaultTo',
  'forConstructor',
  'functionExpression', 
  'functionExpressions',
  'given',
  'givenContext',
  'givenNoArgs',
  'ignore',
  'inherit',
  'mock',
  'mockEach',
  'match',
  'matches',
  'matchArguments',
  'member',
  'memberCall',
  'memberCalls',
  'members',
  'memberUpdate',
  'objectCreate',
  'objectCreates',
  'recursion',
  'setOptions',
  'shouldNotReturn',
  'shouldReturn',
  'shouldSatisfy',
  'shouldNotSatisfy',
  'shouldNotThrow',
  'shouldThrow',
  'requires',
  'returns',
  'takes',
  'takesContext',
  'use',
  'value',
  'values',
  'verify',
  'verifyNotCalled'
]
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
      , recordTypesBySignature = {}
    FunctionType.apply(fnType, [].map.call(args, function(a) {
      return typeof a === 'string' ? a :
        typeUtil.resolveType(a, recordTypesBySignature)
    }))
    return fnType
  })
}

inductive.typeParameter = function(name) {
  return new TypeParameter(name)
}

inductive.smallType = function(name, wrappedType) {
  return new SmallType(name, typeUtil.resolveType(wrappedType, {}))
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
      , recordTypesBySignature = {}
    return isCtor ?
      new ParameterizedType(
        args.slice(0, args.length - 2).map(function(a) {
          return typeUtil.resolveType(a, recordTypesBySignature)
        }),
        args[args.length - 2],
        args[args.length - 1]) :
      new ParameterizedType(
        args.slice(0, args.length - 1).map(function(a) {
          return typeUtil.resolveType(a, recordTypesBySignature)
        }),
        args[args.length - 1])
  })
}

inductive.argumentsType = function() {
  var recordTypesBySignature = {}
  return DeferredApiCall.callChildren(arguments, function(name) {
    return new ArgumentsType(
      [].map.call(arguments, function(t) {
        return typeUtil.resolveType(t, recordTypesBySignature)
      }))
  })
}

inductive.recordType = function() {
  return DeferredApiCall.callChildren(arguments, function() {
    return new RecordType([].slice.apply(arguments))
  })
}

inductive.unionType = function() {
  return DeferredApiCall.callChildren(arguments, function(name) {
    var recordTypesBySignature = {}
    return new UnionType([].map.call(arguments, function(a) {
      return typeUtil.resolveType(a, recordTypesBySignature)
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

function solveSpecification(name, args, TSpecification) {
  var spec
  try {
    spec = DeferredApiCall.callChildren(args, function(name) {
      return new TSpecification(name || '')
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
        inductive.tap.comment(name, 'cached solution failed')
      }
    }

    // Attempt a normal solve
    var start = +(new Date())
    spec.solve()
    var end = +(new Date())
      , elapsed = Math.round(end - start) / 1000
    inductive.tap.log(
      spec.solution, name, ':', spec.getType() + ' solution', elapsed + 's')

    if(spec.solution)
      spec.logSuccess()
    else {
      contents.blocks.push('// Failed ' + name)
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
  return solveSpecification(name, arguments, Specification)
}

inductive.specifyConstructor = function(name) {
  return solveSpecification(name, arguments, ConstructorSpecification)
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

