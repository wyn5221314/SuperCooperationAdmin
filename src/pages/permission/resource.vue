<template>
  <div class="app-container">
    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">添加功能分组</el-button>
    <el-button class="filter-item" type="primary" icon="el-icon-refresh-left" @click="handleSearch">刷新</el-button>

    <el-table
      ref="table"
      v-loading="tableLoading"
      :data="list"
      style="width: 100%;margin-top:30px;margin-bottom: 20px;"
      row-key="resource_id"
      stripe
      lazy
      :load="loadChild"
      :tree-props="{children: 'children', hasChildren: 'child_count'}"
    >
      <el-table-column align="left" label="功能名" min-width="220">
        <template slot-scope="{row}">
          {{ row.name }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="编码" min-width="180">
        <template slot-scope="{row}">
          {{ row.code }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="类型" min-width="150">
        <template slot-scope="{row}">
          {{ globalResourceType[row.type] }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" min-width="80">
        <template slot-scope="{row}">
          {{ globalStatusDis[row.status] }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="所属系统" min-width="180">
        <template slot-scope="{row}">
          {{ formatSystem(row) }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="是否开发中" min-width="100">
        <template slot-scope="{row}">
          {{ globalYesNo[row.is_dev] }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="排序" min-width="80">
        <template slot-scope="{row}">
          {{ row.sort }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="操作" min-width="150">
        <template slot-scope="{row, $index}">
          <el-button type="primary" plain size="mini" @click="handleEdit(row, 'update')">编辑</el-button>
          <el-popover
            v-model="row.dialogVisible"
            placement="top"
            width="180"
          >
            <p>您确定要删除此功能吗？</p>
            <div style="text-align: right; margin: 0">
              <el-button size="mini" type="text" @click="hideDialog(row)">取消</el-button>
              <el-button type="primary" size="mini" @click="handleDelete(row, $index)">确定</el-button>
            </div>
            <el-button slot="reference" type="danger" plain size="mini" class="ml-10">删除</el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :visible.sync="dialogVisible" :title="dialogTitle" :close-on-click-modal="false">
      <el-form ref="dataForm" :rules="rules" :model="info" label-width="100px" label-position="left">
        <el-form-item v-if="dialogType!=='update'" label="所属上级">
          <el-cascader
            ref="fid"
            v-model="info.fid"
            :options="resources"
            placeholder="不选为顶级"
            :props="{ checkStrictly: true, value: 'resource_id', label: 'name' }"
            clearable
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="info.name" placeholder="请输入功能名" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="info.code" placeholder="请输入功能编码" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model.number="info.type" placeholder="请选择功能类型" class="filter-item">
            <el-option v-for="(item, index) in globalResourceType" :key="index" :label="item" :value="Number(index)" />
          </el-select>
        </el-form-item>
        <el-form-item label="依赖API">
          <el-select v-model="info.apiIds" multiple placeholder="请选择依赖API" filterable clearable class="w100">
            <el-option-group
              v-for="group in apis"
              :key="group.api_group_id"
              :label="group.name"
            >
              <el-option
                v-for="item in group.apis"
                :key="item.api_id"
                :label="item.name"
                :value="item.api_id"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用" prop="status">
          <el-switch
            v-model="info.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="是否开发中" prop="is_dev">
          <el-switch
            v-model="info.is_dev"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input v-model="info.sort" placeholder="请输入排序" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="info.remark"
            :autosize="{ minRows: 2, maxRows: 4}"
            type="textarea"
            placeholder="功能说明备注"
          />
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button type="danger" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import table from '@/mixins/table'
import { deepClone } from '@/utils'
import { del, add, edit, editApi, getTree } from '@/api/permission/resource'
import { getTree as getApiTree } from '@/api/permission/api-group'
import { getDic as getSystemDic } from '@/api/permission/system'
import { globalResourceType, globalStatusDis, globalYesNo } from '@/utils/const'

export default {
  name: 'PermissionResource',
  mixins: [
    table
  ],
  props: {
    systemId: {
      type: Number,
      default() {
        return this.$settings.SYSTEM_MANAGE
      }
    }
  },
  data() {
    return {
      dialogVisible: false,
      dialogType: '',
      apis: [],
      systems: [],
      resources: [],
      list: [],
      info: {},
      currentInfo: {},
      checkStrictly: false,
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      rules: {
        name: [{ required: true, message: '请输入功能名', trigger: 'change' }],
        code: [{ required: true, message: '请输入编码', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        systemIds: [{ required: true, message: '请选择所属系统', trigger: 'change' }]
      },
      globalResourceType,
      globalStatusDis,
      globalYesNo,
      maps: new Map()
    }
  },
  computed: {
    dialogTitle() {
      switch (this.dialogType) {
        case 'update':
          return '编辑功能'
        default:
          return '添加功能'
      }
    }
  },
  created() {
    this.init()
  },
  methods: {
    formatSystem(row) {
      if (!row.systems) return '-'
      return deepClone(row.systems).map(item => {
        return item.system_name
      }).join('、')
    },
    init() {
      this.loadTree()
      this.getSystemDic()
      this.loadApiTree()
      this.loadData()
    },
    loadTree() {
      getTree(this.systemId, 0, 1).then(res => {
        this.resources = this.formatTreeData(res.data)
      })
    },
    formatTreeData(data) {
      return data.map(item => {
        if (!item.children || !item.children.length) {
          delete item.children
        } else {
          item.children = this.formatTreeData(item.children)
        }
        return item
      })
    },
    getSystemDic() {
      getSystemDic().then(res => {
        this.systems = res.data
      })
    },
    loadApiTree() {
      getApiTree(this.systemId).then(res => {
        this.apis = res.data
      })
    },
    loadData() {
      getTree(this.systemId, 0, 0).then(res => {
        this.list = this.formatData(res.data)
        this.tableLoading = false
      })
    },
    loadChild(tree, treeNode, resolve) {
      getTree(this.systemId, tree.resource_id, 0).then(res => {
        const pid = tree.resource_id
        this.maps.set(pid, { tree, treeNode, resolve })
        resolve(this.formatData(res.data))
      })
    },
    formatData(data) {
      return data.map(item => {
        item.apiIds = item.apis.map(subItem => {
          return subItem.api_id
        })
        return item
      })
    },
    // 重置表单信息
    resetInfo() {
      this.info = {
        name: '',
        code: '',
        remark: '',
        fid: 1,
        type: 2,
        sort: 0,
        status: 1,
        is_dev: 0,
        apiIds: [],
        system_id: this.systemId
      }
    },
    handleAdd() {
      this.resetInfo()
      this.dialogType = 'create'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleEdit(row, type) {
      this.currentInfo = row
      this.info = Object.assign({}, row) // copy obj
      this.dialogType = type
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleSave() {
      if (typeof this.info.fid === 'object') {
        this.info.fid = this.info.fid[this.info.fid.length - 1]
      }
      this.info.fid = this.info.fid || 0
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          if (this.dialogType === 'create') {
            add(this.info).then(res => {
              this.info.resource_id = res.data.resource_id
              this.info.hasChildren = true
              this.info.dialogVisible = false
              this.handleAddOnSave(this.info)
              this.$message.success('添加成功')
              this.dialogVisible = false
              if (!this.info.fid) {
                this.loadTree()
              }
            })
          } else if (this.dialogType === 'update') {
            edit(this.info).then(res => {
              this.$message.success('编辑成功')
              this.info.hasChildren = true
              this.info.dialogVisible = false
              this.handleEditOnSave(this.info)
              this.dialogVisible = false
            })
          } else if (this.dialogType === 'api') {
            editApi(this.info).then(res => {
              this.$message.success('修改依赖API成功')
              this.dialogVisible = false
            })
          }
        }
      })
    },
    hideDialog(row) {
      row.dialogVisible = false
    },
    handleDelete(row, index) {
      del(row.resource_id).then(res => {
        this.$message.success('删除成功')
        this.hideDialog(row)
        this.deleteLazyTableItem(row)
        this.loadTree()
      })
    },
    deleteLazyTableItem(item) {
      const store = this.$refs.table.store
      if (item.fid !== 0) {
        let parentRow = store.states.data.find(child => child.resource_id === item.fid)
        if (!parentRow) {
          const keys = Object.keys(store.states.lazyTreeNodeMap)
          for (let i = 0; i < keys.length; i++) {
            parentRow = store.states.lazyTreeNodeMap[keys[i]].find(child => child.resource_id === item.fid)
            if (parentRow) {
              break
            }
          }
        }
        // parentRow.childrenCount--
        const parent = store.states.lazyTreeNodeMap[item.fid]
        const index = parent.findIndex(child => child.resource_id === item.resource_id)
        parent.splice(index, 1)
      } else {
        const parent = store.states.data
        const index = parent.findIndex(child => child.resource_id === item.resource_id)
        parent.splice(index, 1)
      }
    },
    // 编辑成功
    handleEditOnSave(model) {
      const newItemData = Object.assign({}, model)
      // const parentId = this.dialogCreateOrEdit.parentId
      // if (model.parent_category_id !== 0) {
      // 未编辑父级节点，更新当前数据
      if (model.fid !== 0) {
        newItemData.hasChildren = false
      }
      Object.assign(this.currentInfo, newItemData)
      // } else {
      //   // 编辑父级节点，先删除当前节点，再去新的父级节点添加子节点
      //   this.deleteLazyTableItem(this.editItem)
      //   if (model.parent === -1) {
      //     // 添加最外层
      //     this.addOuterTableItem(newItemData)
      //   } else {
      //     this.findNewParent(model.parent, newItemData)
      //   }
      // }
    },
    // 新增成功
    handleAddOnSave(model) {
      const newItemData = Object.assign({}, model)
      const parentId = model.fid
      const store = this.$refs.table.store
      if (parentId === 0) {
        // 添加最外层
        this.addOuterTableItem(newItemData)
      } else {
        // const parentRow = this.currentRow
        // parentRow.childrenCount++
        // treeData为所有已加载过的节点的子节点
        const parentTreeNode = store.states.treeData[parentId]
        this.addLazyTableItemToParent(parentTreeNode, parentId, newItemData)
      }
    },
    // 添加数据放到最外层的数据中去
    addOuterTableItem(newItemData) {
      const store = this.$refs.table.store
      store.states.data.push(newItemData)
    },
    // 把数据加到父级节点上去
    addLazyTableItemToParent(parentTreeNode, parentId, newItemData) {
      const store = this.$refs.table.store
      // 如果在已加载过的节点的子节点中
      if (parentTreeNode) {
        // 如果该节点已加载
        if (parentTreeNode.loaded) {
          // 子节点不需要加载下一级功能
          // newItemData.hasChildren = false
          newItemData.levelTwo = true
          if (!store.states.lazyTreeNodeMap[parentId]) {
            // store.states.lazyTreeNodeMap[parentId] = []
            this.$set(store.states.lazyTreeNodeMap, parentId, [])
            this.$set(store.states.treeData, parentId, {
              display: true,
              loading: false,
              loaded: false,
              expanded: false,
              children: [],
              lazy: true,
              level: 0,
              hasChildren: true,
              levelTwo: true
            })
          }
          store.states.lazyTreeNodeMap[parentId].push(newItemData)
        }
      } else {
        this.$set(store.states.lazyTreeNodeMap, parentId, [])
        store.states.treeData[parentId] = {
          display: true,
          loading: false,
          loaded: false,
          expanded: false,
          children: [],
          lazy: true,
          level: 0,
          hasChildren: true,
          levelTwo: true
        }
        store.states.lazyTreeNodeMap[parentId].push(newItemData)
      }
    }
  }
}
</script>

<style scoped>

</style>
