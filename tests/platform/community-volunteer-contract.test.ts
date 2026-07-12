import assert from 'node:assert/strict'
import test from 'node:test'
import { canReviewNgo, matchVolunteerOpportunities } from '../../lib/domain/engagement.ts'

test('reviews require captured giving or approved volunteer service',()=>{assert.equal(canReviewNgo({capturedDonation:true,approvedHours:0}),true);assert.equal(canReviewNgo({capturedDonation:false,approvedHours:3}),true);assert.equal(canReviewNgo({capturedDonation:false,approvedHours:0}),false)})
test('volunteer matching is deterministic across skills location and availability',()=>{const ranked=matchVolunteerOpportunities([{id:'remote',skills:['design'],city:null,remote:true,availability:['weekend']},{id:'local',skills:['teaching'],city:'Jaipur',remote:false,availability:['weekday']}],{skills:['teaching','design'],city:'Jaipur',availability:['weekend']});assert.deepEqual(ranked.map(x=>x.id),['remote','local']);assert.ok(ranked[0].score>ranked[1].score)})
