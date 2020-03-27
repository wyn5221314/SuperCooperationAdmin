<template>
  <div class="app-container">
    <el-form :inline="true" :model="search" class="demo-form-inline">
      <el-form-item>
        <el-input v-model="search.user_name" placeholder="帮手账号/手机号" style="width: 180px;" class="filter-item" clearable />
      </el-form-item>
      <el-form-item>
        <el-input v-model="search.order_name" placeholder="搜索订单名" style="width: 150px;" class="filter-item" clearable />
      </el-form-item>
      <el-form-item>
        <el-input v-model="search.order_no" placeholder="搜索订单号" style="width: 150px;" class="filter-item" clearable />
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.order_type" placeholder="任务类型" clearable style="width: 120px" class="filter-item">
          <el-option v-for="(item, index) in taskTypes" :key="index" :label="item" :value="index" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.category" placeholder="任务分类" clearable style="width: 120px" class="filter-item">
          <el-option v-for="(item, index) in taskTypes" :key="index" :label="item" :value="index" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.receive_state" placeholder="任务状态" clearable style="width: 120px" class="filter-item">
          <el-option v-for="(item, index) in taskReceiveStatus" :key="index" :label="item" :value="index" />
        </el-select>
      </el-form-item>
      <el-form-item label="接单时间：">
        <el-date-picker
          v-model="search.create_time"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button type="warning" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-divider class="mt0" />

    <el-table v-loading="tableLoading" :data="list" style="width: 100%;margin-top:30px;" border stripe>
      <el-table-column align="center" label="接单用户" width="150">
        <template slot-scope="{row}">
          {{ row.user_name }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务编号" width="170">
        <template slot-scope="{row}">
          {{ row.order_no }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务标题" width="200">
        <template slot-scope="{row}">
          {{ row.order_name }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务类型" width="80">
        <template slot-scope="{row}">
          {{ row.display_order_type }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务分类" width="80">
        <template slot-scope="{row}">
          {{ row.category }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务金额" width="80">
        <template slot-scope="{row}">
          {{ row.origin_price / 100 }}元
        </template>
      </el-table-column>
      <el-table-column align="center" label="任务状态" width="100">
        <template slot-scope="{row}">
          {{ row.display_receive_state }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="接单时间" width="160">
        <template slot-scope="{row}">
          {{ row.created_at }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="帮手星级" width="100">
        <template slot-scope="{row}">
          {{ row.helper_level }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template slot-scope="{row}">
          <el-button type="info" size="mini" plain @click="toIm(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="pagination" />
  </div>
</template>

<script>
import table from '@/mixins/table'
import { getReceiveList } from '@/api/task/index'
import { taskTypes, taskReceiveStatus } from '@/utils/const'

export default {
  name: 'TaskList',
  mixins: [
    table
  ],
  data() {
    return {
      listQuery: {
        limit: 10
      },
      search: {
        user_name: '',
        order_name: '',
        order_no: '',
        order_type: '',
        category: '',
        receive_state: '',
        create_time: []
      },
      taskTypes,
      taskReceiveStatus
    }
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      this.loadData()
    },
    loadData() {
      getReceiveList(this.listQuery.page, this.listQuery.limit, JSON.stringify(this.search)).then(res => {
        this.loadedData(res)
      })
    },
    handleReset() {
      this.search = {
        user_name: '',
        order_name: '',
        order_no: '',
        order_type: '',
        category: '',
        order_state: '',
        create_time: []
      }
    }
  }
}
</script>

<style scoped>

</style>