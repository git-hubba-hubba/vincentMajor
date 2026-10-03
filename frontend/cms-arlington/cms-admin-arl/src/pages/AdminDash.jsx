import Namespace from '../components/Namespace'
import AdminCMS from '../components/AdminCMS'
import SiteTextAdmin from '../components/SiteTextAdmin'
import IncentiveAdmin from '../components/IncentiveAdmin'

function AdminDash({ user }) {
  return (
    <>
    <img src="/images/adminDash.png" alt="" className="adImg" />
    <Namespace title={"Admin Dashboard"}/>
    <AdminCMS user={user} />
    {user?.role==="admin"&&<IncentiveAdmin />}
    {user?.role==="admin"&&<SiteTextAdmin user={user} />}
    
    
    </>
  )
}

export default AdminDash
