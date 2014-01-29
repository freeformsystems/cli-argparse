var short = '-', long = '--';
var sre = /^-[^-]+/, lre = /^--[^-]+/, negate = /^--no-/;

function camelcase(flag) {
  return flag.split('-').reduce(function(str, word){
    return str + word[0].toUpperCase() + word.slice(1);
  });
}

function toOptionKey(arg, negated, opts) {
  var key = arg.replace(/^-+/, '');
  if(negated) key = key.replace(/^no-/, '')
  key = camelcase(key);
  return alias(key, opts);
}

function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function alias(key, opts) {
  var alias = opts.alias, z, keys;
  for(z in alias) {
    keys = z.split(/\s+/);
    if(keys.indexOf(key) > -1) return alias[z];
  }
  return key;
}

function flags(arg, output, next, opts) {
  arg = arg.replace(/^-/, '');
  var keys = arg.split('');
  keys = keys.filter(unique);
  keys.forEach(function(key) {
    key = alias(key, opts);
    output.flags[key] = true;
  })
  return false;
}

function options(arg, output, next, opts) {
  var equals = arg.indexOf('='), value, result = false, negated;
  var flag = false, key;
  if(!next || (next && next.indexOf('-') == 0 && equals == -1)) {
    flag = true;
  }
  if(equals > -1) {
    value = arg.slice(equals + 1);
    arg = arg.slice(0, equals);
  }else if(next && !flag) {
    value = next;
    result = true;
  }
  negated = negate.test(arg);
  key = toOptionKey(arg, negated, opts);
  if(flag) {
    output.flags[key] = negated ? false : true;
  }else{
    if(!output.options[key]) {
      output.options[key] = value;
    }else{
      if(!Array.isArray(output.options[key])) {
        output.options[key] = [output.options[key]];
      }
      output.options[key].push(value);
    }
  }
  return result;
}

function parse(args, opts) {
  var output = {flags: {}, options: {},
    raw: args.slice(0), stdin: false, unparsed: []};
  var i, arg, l = args.length, key, skip;
  opts = opts || {}; opts.alias = opts.alias || {};
  args = args || process.argv.slice(2);
  args = args.slice(0);
  for(i = 0;i < l;i++) {
    if(!args[0]) break;
    arg = '' + args.shift(), skip = false;
    if(arg == short) {
      output.stdin = true;
    }else if(arg == long) {
      output.unparsed = output.unparsed.concat(args.slice(i));
      break;
    }else if(sre.test(arg)) {
      skip = flags(arg, output, args[0], opts);
    }else if(lre.test(arg)) {
      skip = options(arg, output, args[0], opts);
    }else{
      output.unparsed.push(arg);
    }
    if(skip) args.shift(); l--; i--;
  }
  return output;
}

module.exports = parse;
