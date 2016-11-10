<template>
  <div id="app">
    <section class="todoapp">
      <header class="header">
        <h1>Labs</h1>
        <input class="new-todo"
          autofocus autocomplete="off"
          placeholder="What lab needs to be found?"
          v-model="filterTitle">
      </header>
      <section class="main" v-show="todos.length" v-cloak>
        <input class="toggle-all" type="checkbox" v-model="allDone">
        <ul class="todo-list">
          <li v-for="todo in filteredTodos"
            class="todo"
            :key="todo.id"
            :class="{ completed: todo.completed, editing: todo == editedTodo }">
            <div class="view">
              <input class="toggle" type="checkbox" v-model="todo.completed">
              <label @dblclick="editTodo(todo)">
                <span style="float: left" class="caption">{{ todo.title }}</span>
                <el-tag style="float: right; margin-left: 5px" v-for="tag, tagIndex in todo.tags" :closable="true" type='success' :key='tag' :close-transitino='true' @close='closeTag(todo, tagIndex)'>
                  {{tag}}
                </el-tag>
                <div style="clear:both;"></div>
              </label>
              <button class="destroy" @click="gotoDetail(todo)"><i class="el-icon-share"></i></button>
            </div>
            <input class="edit" type="text"
              v-model="todo.tag"
              v-todo-focus="todo == editedTodo"
              @blur="doneEdit(todo)"
              @keyup.enter="doneEdit(todo)"
              @keyup.esc="cancelEdit(todo)">
          </li>
        </ul>
      </section>
      <footer class="footer" v-show="todos.length" v-cloak>
        <span class="todo-count">
          <strong>{{ remaining }}</strong> {{ remaining | pluralize }} left
        </span>
        <ul class="filters">
          <li><a href="#/all" :class="{ selected: visibility == 'all' }">All</a></li>
          <li><a href="#/active" :class="{ selected: visibility == 'active' }">Active</a></li>
          <li><a href="#/completed" :class="{ selected: visibility == 'completed' }">Completed</a></li>
        </ul>
        <button class="clear-completed" @click="removeCompleted" v-show="todos.length > remaining">
          Clear completed
        </button>
      </footer>
    </section>
    <footer class="info">
      <p>Double-click to edit a lab's tag</p>
      <p>Written by <a href="http://evanyou.me">Wenxiao Chen</a></p>
      <p>Part of <a href="http://todomvc.com">Opprentice</a></p>
    </footer>
  </div>
</template>


<script>

  var STORAGE_KEY = 'todos-vuejs-2.0'
  var todoStorage = {
    fetch: function (app) {
      return app.$http.get('/lab').then(function(res){
        app.todos = JSON.parse(res.data);
        todoStorage.uid = app.todos.length
      }, function(res) {
        app.todos = [{id : 0, title : 'shiro', completed: false, tags: ['latest'], path : 'shiro/latest'}, 
                     {id : 1, title : 'shana', completed: false, tags: ['wonderful'], path : 'shiro/wonderful'}, 
                     {id : 2, title : 'monoka', completed: false, tags: ['cnn'], path : 'shiro/cnn'}, 
                     {id : 3, title : 'tiger', completed: false, tags: ['lstm'], path : 'shiro/lstm'}];
        todoStorage.uid = app.todos.length
      });
    },

    save: function (todos) {
      //localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
  }

  var filters = {
    all: function (todos) {
      return todos
    },

    active: function (todos) {
      return todos.filter(function (todo) {
        return !todo.completed
      })
    },

    completed: function (todos) {
      return todos.filter(function (todo) {
        return todo.completed
      })
    },

    title: function(todos, search) {
      var title = search.split(':')[0];
      var tag = search.split(':')[1];
      return todos.filter(function(todo) {
        if (todo.title.indexOf(title) >= 0) {
          if (tag) {
            for (var t in todo.tags) {
              if (todo.tags[t].indexOf(tag) >= 0)
                return true
            }
          } else {
            return true
          }
        }
        return false
      })
    }
  }

  export default {
    data() {
      return {
        todos: [],
        newTodo: '',
        editedTodo: null,
        visibility: 'all',
        filterTitle: ''
      }
    },

    mounted() {
      todoStorage.fetch(this);
    },

    watch: {
      '$route' (to, from) {
        var path = to.path.replace(/\//, '');
        if (filters[path]) {
          this.$set(this, 'visibility', path)
        } else {
          this.$set(this, 'visibility', 'all')
        }
      },

      todos: {
        handler: function (todos) {
          todoStorage.save(todos)
        },
        deep: true
      }
    },

    computed: {
      filteredTodos: function () {
        var todos = filters[this.visibility](this.todos);
        return filters['title'](todos, this.filterTitle)
      },

      remaining: function () {
        return this.filteredTodos.length
      },

      allDone: {
        get: function () {
          return this.remaining === 0
        },
        set: function (value) {
          this.todos.forEach(function (todo) {
            todo.completed = value
          })
        }
      }
    },

    filters: {
      pluralize: function (n) {
        return n === 1 ? 'lab' : 'labs'
      }
    },

    methods: {
      gotoDetail: function (todo) {
        window.open("/report?path=" + todo.path)
      },

      editTodo: function (todo) {
        this.editedTodo = todo
      },

      doneEdit: function (todo) {
        if (!this.editedTodo) {
          return
        }
        this.editedTodo = null
        if (todo.tag) {
          todo.tag = todo.tag.trim()
          todo.tags.push(todo.tag)
        }
      },

      cancelEdit: function (todo) {
        this.editedTodo = null
      },

      removeCompleted: function () {
        this.todos = filters.active(this.todos)
      },

      closeTag: function(todo, index) {
        if (index >=0 && index < todo.tags.length)
          todo.tags.splice(index, 1)
      }
    },

    directives: {
      'todo-focus': function (el, value) {
        if (value) {
          el.focus()
        }
      }
    }
  }

</script>

<style>
  @import 'css/todo.css';
</style>