import React from 'react'

import {IconButton} from 'react-mdl'

import Avatar from 'components/common/avatar.jsx'

import ProfileActions from 'actions/profile'

import NavActions from 'actions/nav'

let Header = React.createClass({
  contextTypes: {
    profile: React.PropTypes.any
  },
  editProfile() {
    ProfileActions.show()
    NavActions.hide()
  },
  render() {
    let initials, {profile} = this.context

    if (profile.name)
      initials = profile.name[0]

    return (
      <header className="jlc-nav-header">
        <Avatar src={profile.img}>{initials}</Avatar>
        <div className="jlc-nav-profile">
          <div className="jlc-nav-profile-details">
            <span className="jlc-nav-profile-name">{profile.name}</span>
            <span className="jlc-nav-profile-email">{profile.email}</span>
          </div>
          <IconButton name="mode_edit" onClick={this.editProfile}/>
        </div>
      </header>
    )
  }
})

export default Header
