import { post, put, delRequest } from '@/api/api'

// 列表
export const getList = (page, limit, filter) => post('api/list', { page, limit, filter })

// 添加
export const add = ({ system_id, group_id, name, path, method, status, is_dev, need_power, sort, remark }) => post('api/add', { system_id, group_id, name, path, method, status, is_dev, need_power, sort, remark })

// 编辑
export const edit = ({ system_id, api_id, group_id, name, path, method, status, is_dev, need_power, sort, remark }) => put('api/edit', { system_id, api_id, group_id, name, path, method, status, is_dev, need_power, sort, remark })

// 删除
export const del = (api_id) => delRequest('api/del', { api_id })
