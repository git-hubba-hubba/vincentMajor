import React from 'react'
import Namespace from '../components/Namespace'
import AdminCMS from '../components/AdminCMS'

function AdminDash({ user }) {
  return (
    <>
    <img src="/images/adminDash.png" alt="" className="adImg" />
    <Namespace title={"Admin Dashboard"}/>
    <AdminCMS user={user} />
    
    
    </>
  )
}

export default AdminDash
